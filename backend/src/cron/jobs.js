// cron/index.js
import cron from 'node-cron';
import { Booking, Room, User, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import {
  getOrCreateCredit,
  refundCredits
} from '../services/creditService.js';
import emailService from '../services/emailService.js'; 

const GHOST_GRACE_MINUTES = Number(process.env.GHOST_GRACE_MINUTES || 15);

/* ---------------------------------------------------
   GHOST / NO-SHOW BOOKINGS
   --------------------------------------------------- */

function startAll() {
  cron.schedule('*/5 * * * *', async () => {
    const transaction = await sequelize.transaction();

    try {
      const now = new Date();
      const threshold = new Date(
        now.getTime() - GHOST_GRACE_MINUTES * 60 * 1000
      );

      const ghostBookings = await Booking.findAll({
        where: {
          status: 'CONFIRMED',
          checkedIn: false,
          startTime: { [Op.lt]: threshold }
        },
        include: [Room, User],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      for (const booking of ghostBookings) {
        booking.status = 'NO_SHOW';
        await booking.save({ transaction });

        const user = booking.User;
        const room = booking.Room;

        if (!user || !room) continue;

        const hours =
          (new Date(booking.endTime) - new Date(booking.startTime)) /
          (1000 * 60 * 60);

        const creditsUsed = Math.ceil(hours * room.creditsPerHour);

        // FULL refund on NO_SHOW
        await refundCredits(
          user.departmentId,
          creditsUsed,
          transaction
        );

        // Send notification email asynchronously
        if (booking.User) {
          emailService.sendNoShowNotificationEmail(booking.id).catch(err => {
            console.error(
              `Email failed for no-show ${b.id}:`,
              err.message
            );
          });
        }
      }

      await transaction.commit();
      console.log(`[CRON] No-show bookings processed: ${ghostBookings.length}`);
    } catch (err) {
      await transaction.rollback();
      console.error('[CRON] Ghost booking job failed', err);
    }
  });

  /* ---------------------------------------------------
     MONTHLY CREDIT INITIALIZATION
     --------------------------------------------------- */

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
        await getOrCreateCredit(departmentId, transaction);
      }

      await transaction.commit();
      console.log('[CRON] Monthly department credits initialized');
    } catch (err) {
      await transaction.rollback();
      console.error('[CRON] Monthly credit job failed', err);
    }
  });

  /* ---------------------------------------------------
    AUTO CHECK-OUT BOOKINGS
   --------------------------------------------------- */

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
