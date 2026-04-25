// cron/index.js
import cron from 'node-cron';
import { Booking, Room, User, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import {
  getOrCreateCredit,
  refundCredits,
  releaseLockedCredits,
  resetMonthlyCredits
} from '../services/creditService.js';
import emailService from '../services/emailService.js';
import { emailQueue } from '../queues/emailQueue.js';
import { returnResourcesForBooking } from '../services/resourceReturnService.js';

const GHOST_GRACE_MINUTES = Number(process.env.GHOST_GRACE_MINUTES || 15);

//  GHOST / NO-SHOW BOOKINGS

function startAll() {
  // AUTO-EXPIRE APPROVAL (PENDING) BOOKINGS
  // If the start time has passed and the booking is still PENDING, we:
  // - release locked credits
  // - return any allocated resources
  // - mark as REJECTED (expired due to missed approval window)
  // - notify the user via email
  cron.schedule('*/5 * * * *', async () => {
    const transaction = await sequelize.transaction();
    const emailJobs = [];

    try {
      const now = new Date();

      const pendingExpired = await Booking.findAll({
        where: {
          status: 'PENDING',
          startTime: { [Op.lte]: now }
        },
        include: [{ model: User }],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      for (const booking of pendingExpired) {
        // unlock/refund locked credits (if any)
        if (booking.creditsUsed > 0 && booking.departmentId) {
          await releaseLockedCredits(
            booking.departmentId,
            booking.creditsUsed,
            transaction
          );
        }

        // release held resources/inventory
        if (!booking.checkedOut) {
          await returnResourcesForBooking(booking.id, transaction);
          booking.checkedOut = true;
        }

        booking.status = 'EXPIRED';
        booking.decidedBy = null;
        await booking.save({ transaction });

        emailJobs.push(booking.id);
      }

      await transaction.commit();

      for (const bookingId of emailJobs) {
        await emailQueue.add('booking-expired', { bookingId });
      }

      console.log(`[CRON] Approval expiry processed: ${pendingExpired.length}`);
    } catch (err) {
      await transaction.rollback();
      console.error('[CRON] Approval expiry failed', err);
    }
  });

  cron.schedule('*/5 * * * *', async () => {
    const transaction = await sequelize.transaction();
    const emailJobs = [];

    try {
      const threshold = new Date(
        Date.now() - GHOST_GRACE_MINUTES * 60 * 1000
      );

      const ghostBookings = await Booking.findAll({
        where: {
          status: 'CONFIRMED',
          checkedIn: false,
          startTime: { [Op.lt]: threshold }
        },
        include: [
          {
            model: Room,
            attributes: ['creditsPerHour']
          },
          { model: User }
        ],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      for (const booking of ghostBookings) {
        const room = booking.Room;
        if (!room || !booking.User) continue;

        const hours =
          (new Date(booking.endTime) - new Date(booking.startTime)) /
          36e5;

        const creditsUsed = Math.ceil(hours * room.creditsPerHour);

        // RETURN RESOURCES EVEN IF NOT CHECKED IN
        if (!booking.checkedOut) {
          await returnResourcesForBooking(booking.id, transaction);
        }

        booking.status = 'NO_SHOW';
        booking.creditsUsed = creditsUsed;
        booking.checkedOut = true;

        await booking.save({ transaction });
        await refundCredits(
          booking.User.departmentId,
          creditsUsed,
          transaction
        );

        emailJobs.push(booking.id);
      }

      await transaction.commit();

      // send emails
      for (const bookingId of emailJobs) {
        await emailQueue.add('booking-no-show', {
          bookingId
        });
      }

      console.log(`[CRON] No-show processed: ${ghostBookings.length}`);
    } catch (err) {
      await transaction.rollback();
      console.error('[CRON] Ghost booking failed', err);
    }
  });

  //  MONTHLY CREDIT INITIALIZATION

  cron.schedule('0 0 1 * *', async () => {
    const transaction = await sequelize.transaction();

    try {
      const users = await User.findAll({
        attributes: ['departmentId'],
        transaction
      });

      const uniqueDepartments = [
        ...new Set(users.map(u => u.departmentId).filter(Boolean))
      ];

      for (const departmentId of uniqueDepartments) {
        await resetMonthlyCredits(departmentId, transaction);
      }

      await transaction.commit();
      console.log('[CRON] Monthly department credits initialized');
    } catch (err) {
      await transaction.rollback();
      console.error('[CRON] Monthly credit job failed', err);
    }
  },
    {
      timezone: 'Asia/Kolkata'
    }
  );

  // AUTO CHECK-OUT BOOKINGS

  cron.schedule('*/5 * * * *', async () => {
    const transaction = await sequelize.transaction();

    try {
      const now = new Date();

      const bookingsToCheckout = await Booking.findAll({
        where: {
          status: 'CONFIRMED',
          checkedIn: true,
          checkedOut: false,
          endTime: {
            [Op.lte]: now
          }
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      for (const booking of bookingsToCheckout) {
        // RETURN INVENTORY
        await returnResourcesForBooking(booking.id, transaction);

        booking.checkedOut = true;
        // booking.checkedOutAt = now;
        await booking.save({ transaction });
      }

      await transaction.commit();
      console.log(
        `[CRON] Auto check-out processed: ${bookingsToCheckout.length}`
      );
    } catch (err) {
      await transaction.rollback();
      console.error('[CRON] Auto check-out failed', err);
    }
  });

  console.log('✅ Cron jobs started');
}

export default { startAll };
