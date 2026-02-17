// controllers/approvalController.js
import { Booking, Room, Resource, sequelize, Department, User } from '../models/index.js';
import { emailQueue } from '../queues/emailQueue.js';
import { QueryTypes } from 'sequelize';
import {
  deductLockedCredits,
  releaseLockedCredits
} from '../services/creditService.js';
import emailService from '../services/emailService.js';
import { returnResourcesForBooking } from '../services/resourceReturnService.js';

const attachAggregatedResources = async (bookings) => {
  const plainBookings = bookings.map((b) => (b?.toJSON ? b.toJSON() : b));
  if (plainBookings.length === 0) return plainBookings;

  const bookingIds = plainBookings.map((b) => b.id).filter(Boolean);
  if (bookingIds.length === 0) return plainBookings;

  const rows = await sequelize.query(
    `
      SELECT
        br.bookingId AS bookingId,
        br.resourceId AS resourceId,
        r.name AS resourceName,
        SUM(br.quantity) AS quantity
      FROM booking_resources br
      INNER JOIN resource r ON r.id = br.resourceId
      WHERE br.bookingId IN (:bookingIds)
      GROUP BY br.bookingId, br.resourceId, r.name
    `,
    {
      replacements: { bookingIds },
      type: QueryTypes.SELECT
    }
  );

  const byBooking = new Map();
  for (const row of rows) {
    const bookingId = Number(row.bookingId);
    const resource = {
      id: Number(row.resourceId),
      name: row.resourceName,
      BookingResource: {
        quantity: Number(row.quantity) || 0
      }
    };
    if (!byBooking.has(bookingId)) byBooking.set(bookingId, []);
    byBooking.get(bookingId).push(resource);
  }

  return plainBookings.map((b) => ({
    ...b,
    Resources: byBooking.get(Number(b.id)) || (Array.isArray(b.Resources) ? b.Resources : [])
  }));
};

export const getPendingBookings = async (req, res) => {
  try {
    const { departmentId } = req.query;

    const where = {
      status: 'PENDING',
      // departmentId: req.user.departmentId
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
          attributes: ['id', 'name', 'type']
        },
        {
          model: Resource,
          attributes: ['id', 'name'],
          through: { attributes: ['quantity'] }
        }
      ],

      order: [['createdAt', 'ASC']]
    });

    const withTotals = await attachAggregatedResources(pendingBookings);
    return res.json(withTotals);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const approveBooking = async (req, res) => {
  const { bookingId, action } = req.body;
  const admin = req.user;

  const t = await sequelize.transaction();
  try {
    const booking = await Booking.findByPk(bookingId, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!booking || booking.status !== 'PENDING') {
      throw new Error('Invalid booking');
    }

    if (action === 'REJECT') {
      await releaseLockedCredits(
        booking.departmentId,
        booking.creditsUsed,
        t
      );
      if (!booking.checkedOut) {
        await returnResourcesForBooking(booking.id, t);
      }
      booking.status = 'REJECTED';
      // booking.checkedOut = true;
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
    return res.json({ ok: true });
  } catch (err) {
    await t.rollback();
    return res.status(400).json({ error: err.message });
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
