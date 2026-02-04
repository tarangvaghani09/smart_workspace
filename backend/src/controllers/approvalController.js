// controllers/approvalController.js
import { Booking, Room, Resource, sequelize, Department, User, BookingRoom } from '../models/index.js';
import { emailQueue } from '../queues/emailQueue.js';
import {
  deductLockedCredits,
  releaseLockedCredits
} from '../services/creditService.js';
import emailService from '../services/emailService.js';

export const getPendingBookings = async (req, res) => {
  try {
    const { departmentId } = req.query;

    const where = {
      status: 'PENDING'
    };

    // Apply department filter
    if (departmentId) {
      where.departmentId = Number(departmentId);
    }

    const pendingBookings = await Booking.findAll({
      where,
      include: [
        {
          model: Department,
          attributes: ['id', 'name']
        },
        {
          model: User,
          attributes: ['id', 'name', 'email']
        },
        {
          model: Room,
          attributes: ['id', 'name', 'type'],
          through: { attributes: [] } // hides booking_rooms
        },
        {
          model: Resource,
          attributes: ['id', 'name'],
          through: { attributes: ['quantity'] }
        }
      ],

      order: [['createdAt', 'ASC']]
    });

    res.json(pendingBookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const approveBooking = async (req, res) => {
  const { bookingId, action } = req.body;
  const admin = req.user;

  const t = await sequelize.transaction();
  try {
    const booking = await Booking.findByPk(bookingId, { transaction: t });

    if (!booking || booking.status !== 'PENDING') {
      throw new Error('Invalid booking');
    }

    if (action === 'REJECT') {
      await releaseLockedCredits(
        booking.departmentId,
        booking.creditsUsed,
        t
      );
      booking.status = 'REJECTED';
      booking.decidedBy = admin.id;
      await booking.save({ transaction: t });
      await t.commit();
      // enqueue email (non-blocking)
      await emailQueue.add('booking-rejected', {
        bookingId: booking.id
      });
      return res.json({ ok: true });
    }

    await deductLockedCredits(
      booking.departmentId,
      booking.creditsUsed,
      t
    );

    booking.status = 'CONFIRMED';
    booking.decidedBy = admin.id;
    // booking.approvedAt = new Date();
    await booking.save({ transaction: t });

    await t.commit();
    // enqueue email (non-blocking)
    await emailQueue.add('booking-confirmed', {
      bookingId: booking.id
    });
    res.json({ ok: true });
  } catch (err) {
    await t.rollback();
    res.status(400).json({ error: err.message });
  }
};


// const rejectBooking = async (req, res) => {
//   const user = req.user;

//   if (user.role !== 'admin') {
//     return res.status(403).json({ error: 'Only admin can reject bookings' });
//   }

//   const { bookingId } = req.body;

//   if (!bookingId) {
//     return res.status(400).json({ error: 'bookingId is required' });
//   }

//   const booking = await Booking.findByPk(bookingId);

//   if (!booking) {
//     return res.status(404).json({ error: 'Booking not found' });
//   }

//   if (booking.status !== 'PENDING') {
//     return res.status(400).json({ error: 'Only PENDING bookings can be rejected' });
//   }

//   booking.status = 'REJECTED';
//   // booking.decidedAt = new Date(); // if column exists
//   await booking.save();

//   return res.json({ ok: true, booking });
// };



export default {
  getPendingBookings,
  approveBooking
  // rejectBooking
};
