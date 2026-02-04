// cron/index.js
import cron from 'node-cron';
import { Booking, BookingRoom, Room, User, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import {
  getOrCreateCredit,
  refundCredits,
  resetMonthlyCredits
} from '../services/creditService.js';
import emailService from '../services/emailService.js';
import { emailQueue } from '../queues/emailQueue.js';

const GHOST_GRACE_MINUTES = Number(process.env.GHOST_GRACE_MINUTES || 15);

//  GHOST / NO-SHOW BOOKINGS

function startAll() {
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
            attributes: ['creditsPerHour'],
            through: { attributes: [] }
          },
          { model: User }
        ],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      for (const booking of ghostBookings) {
        const room = booking.Rooms?.[0];
        if (!room || !booking.User) continue;

        const hours =
          (new Date(booking.endTime) - new Date(booking.startTime)) /
          36e5;

        const creditsUsed = Math.ceil(hours * room.creditsPerHour);

        booking.status = 'NO_SHOW';
        booking.creditsUsed = creditsUsed;

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
