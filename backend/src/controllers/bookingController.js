// Booking controller
import {
  Booking,
  Room,
  Resource,
  BookingResource,
  BookingRoom,
  DepartmentCredit,
  sequelize,
  User,
  Department
} from '../models/index.js';

import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import emailService from '../services/emailService.js';
import { lockCredits, deductCredits, refundCredits } from '../services/creditService.js';
import { createBookingSchema } from '../validators/booking.schema.js';
import { createRoomSchema, updateRoomSchema } from '../validators/room.schema.js';
import { emailQueue } from '../queues/emailQueue.js';

export function hoursBetween(start, end) {
  return Math.max(
    0,
    Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60))
  );
}

export function calculateCredits({ creditsPerHour }, hours, quantity = 1) {
  return hours * creditsPerHour * quantity;
}

const isWithinAllowedHours = (start, end) => {
  const startHour = start.getHours();
  const endHour = end.getHours();
  const endMinutes = end.getMinutes();

  // Allowed: 09:00 to 17:00 (5 PM sharp)
  const isStartValid = startHour >= 9;
  const isEndValid =
    endHour < 17 || (endHour === 17 && endMinutes === 0);

  return isStartValid && isEndValid;
};

const isRoomAvailable = async (roomId, start, end, t) => {
  if (!roomId) return true;

  const room = await Room.findByPk(roomId, { transaction: t });
  if (!room || !room.isActive) return false; // block inactive rooms

  const conflict = await Booking.findOne({
    where: {
      status: { [Op.in]: ['CONFIRMED', 'PENDING'] },
      checkedOut: false,
      startTime: { [Op.lt]: end },
      endTime: { [Op.gt]: start }
    },
    include: [{
      model: Room,
      where: { id: roomId },
      through: { attributes: [] }
    }],
    transaction: t,
    lock: t.LOCK.UPDATE
  });

  return !conflict;
};

const isResourceAvailable = async (
  resourceId,
  qty,
  start,
  end,
  t
) => {
  const resource = await Resource.findByPk(resourceId, { transaction: t });

  if (!resource || !resource.isActive) {
    throw new Error('Resource not available');
  }

  // SUM ONLY booking_resources.quantity
  const bookedQty = await BookingResource.sum('quantity', {
    where: {
      resourceId
    },
    include: [{
      model: Booking,
      attributes: [],   // remove Booking columns
      where: {
        status: { [Op.in]: ['CONFIRMED', 'PENDING'] },
        checkedOut: false,
        startTime: { [Op.lt]: end },
        endTime: { [Op.gt]: start }
      }
    }],
    transaction: t,
    lock: t.LOCK.UPDATE
  });

  return (bookedQty || 0) + qty <= resource.quantity;
};

const createBooking = async (req, res) => {

  const parsed = createBookingSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors
    });
  }

  const {
    roomId = null,
    resources = [],
    startTime,
    endTime,
    title,
    recurrenceType = 'ONE_TIME',
    weeks = 1
  } = parsed.data;

  const t = await sequelize.transaction();

  try {
    const user = req.user;

    if (!user.departmentId) {
      return res.status(400).json({
        error: 'User must belong to a department to create bookings'
      });
    }

    if (!roomId && resources.length === 0) {
      throw new Error('Booking must include a room or at least one resource');
    }

    /* ---------- OCCURRENCES ---------- */
    const occurrences = [];

    for (let i = 0; i < weeks; i++) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (recurrenceType === 'WEEKLY') {
        start.setDate(start.getDate() + i * 7);
        end.setDate(end.getDate() + i * 7);
      }

      occurrences.push({ start, end });
    }

    const now = new Date();

    /* ---------- AVAILABILITY CHECK ---------- */
    for (const o of occurrences) {

      // Past time check
      if (o.start < now) {
        throw new Error('Cannot book a time that has already passed');
      }
      if (o.end <= o.start) {
        throw new Error('End time must be after start time');
      }
      //  TIME RESTRICTION CHECK
      if (!isWithinAllowedHours(o.start, o.end)) {
        throw new Error(
          'Bookings are allowed only between 9:00 AM and 5:00 PM'
        );
      }

      if (roomId) {
        const ok = await isRoomAvailable(roomId, o.start, o.end, t);
        if (!ok) {
          // throw new Error(`Room conflict on ${o.start.toDateString()}`);
          throw new Error('Selected room is not available');
        }
      }

      for (const r of resources) {
        const ok = await isResourceAvailable(
          r.resourceId,
          r.quantity || 1,
          o.start,
          o.end,
          t
        );

        if (!ok) {
          // throw new Error(`Resource unavailable on ${o.start.toDateString()}`);
          throw new Error('Selected resource is not available for the chosen time');
        }
      }
    }

    /* ---------- CREDIT CALCULATION ---------- */
    let totalCredits = 0;
    let room = null;

    for (const o of occurrences) {
      const hours = hoursBetween(o.start, o.end);

      // ROOM credits
      if (roomId) {
        room = room || await Room.findByPk(roomId, { transaction: t, lock: t.LOCK.UPDATE });  //prevents simultaneous approval/credit logic conflicts
        if (!room) throw new Error('Room not found');

        if (!room.isActive) {
          throw new Error('Selected room is not available'); //inactive rooms
        }

        totalCredits += calculateCredits(room, hours, 1);
      }

      // RESOURCE credits
      for (const r of resources) {
        const resource = await Resource.findByPk(r.resourceId, {
          transaction: t
        });

        if (!resource || !resource.isActive) {
          throw new Error('Resource not available');
        }

        totalCredits += calculateCredits(
          resource,
          hours,
          r.quantity || 1
        );
      }
    }

    /* ---------- APPROVAL / DEDUCTION ---------- */
    const requiresApproval =
      room &&
      (user.role === 'junior') &&
      room.type === 'boardroom';

    if (totalCredits > 0) {
      if (requiresApproval) {
        await lockCredits(user.departmentId, totalCredits, t);
      } else {
        await deductCredits(user.departmentId, totalCredits, t);
      }
    }

    /* ---------- BOOKING TYPE ---------- */
    let bookingType = 'ROOM_RESOURCE';

    if (roomId && resources.length === 0) bookingType = 'ROOM';
    if (!roomId && resources.length > 0) bookingType = 'RESOURCE';

    /* ---------- CREATE BOOKINGS ---------- */
    const groupId = recurrenceType === 'WEEKLY' ? uuidv4() : null;
    const bookings = [];

    for (const o of occurrences) {
      const hours = hoursBetween(o.start, o.end);
      let bookingCredits = 0;

      if (room) {
        bookingCredits += calculateCredits(room, hours, 1);
      }

      for (const r of resources) {
        const resource = await Resource.findByPk(r.resourceId, {
          transaction: t
        });

        bookingCredits += calculateCredits(
          resource,
          hours,
          r.quantity || 1
        );
      }

      const booking = await Booking.create({
        uid: uuidv4(),
        title,
        bookingType,
        userId: user.id,
        departmentId: user.departmentId,
        startTime: o.start,
        endTime: o.end,
        status: requiresApproval ? 'PENDING' : 'CONFIRMED',
        creditsUsed: bookingCredits,
        isRecurring: recurrenceType === 'WEEKLY',
        recurringGroup: groupId
      }, { transaction: t });

      /* ---------- ROOM CHILD ---------- */
      if (roomId) {
        await BookingRoom.create({
          bookingId: booking.id,
          roomId
        }, { transaction: t });
      }

      /* ---------- RESOURCE CHILD ---------- */
      for (const r of resources) {
        await BookingResource.create({
          bookingId: booking.id,
          resourceId: r.resourceId,
          quantity: r.quantity || 1
        }, { transaction: t });
      }
      bookings.push(booking);
    }

    await t.commit();

    /* ---------- SEND EMAIL AFTER COMMIT ---------- */
    for (const b of bookings) {
      if (b.status === 'CONFIRMED') {
        await emailQueue.add('booking-confirmed', {
          bookingId: b.id
        });
      }
    }

    res.json({ ok: true, count: bookings.length, bookings });

  } catch (err) {
    await t.rollback();
    res.status(400).json({ error: err.message });
  }
};

const listBookings = async (req, res) => {
  const user = req.user;

  const bookings = await Booking.findAll({
    where: { userId: user.id },

    include: [
      {
        model: Room,
        attributes: ['id', 'name', 'type'],
        through: { attributes: [] }
      },
      {
        model: Resource,
        attributes: ['id', 'name'],
        through: {
          model: BookingResource,
          attributes: ['quantity']
        }
      }
    ],

    order: [['startTime', 'ASC']]
  });

  res.json(bookings);
};

const getBooking = async (req, res) => {
  const booking = await Booking.findByPk(req.params.id, {
    include: [
      Room,
      {
        model: Resource,
        through: { attributes: ['quantity'] }
      }
    ]
  });

  if (!booking) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json(booking);
};

const createRoom = async (req, res) => {
  const result = createRoomSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  const { name, type, capacity, creditsPerHour, location, amenities } = result.data;

  const transaction = await sequelize.transaction();

  try {
    const existing = await Room.findOne({
      where: { name },
      transaction
    });

    if (existing) {
      await transaction.rollback();
      return res.status(409).json({
        error: 'Room with this name already exists'
      });
    }

    const room = await Room.create(
      {
        name,
        type,
        capacity,
        creditsPerHour,
        location: location || null,
        features: amenities || {}
      },
      { transaction }
    );

    await transaction.commit();
    return res.status(201).json({ ok: true, room });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

/*--------------- Soft delete (disable room) -------------*/

const toggleRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findByPk(id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    await room.update({ isActive: !room.isActive });
    res.json({
      ok: true,
      message: 'Room toggled successfully'
    });
  } catch (err) {
    console.error('Toggle room error:', err);
    res.status(500).json({ error: err.message });
  }
};

const updateRoom = async (req, res) => {
  const { id } = req.params;

  const parseResult = updateRoomSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: parseResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  const { name, type, capacity, creditsPerHour, location, amenities } = parseResult.data;

  const room = await Room.findByPk(id);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const transaction = await sequelize.transaction();

  try {
    if (name && name !== room.name) {
      const existing = await Room.findOne({
        where: { name },
        transaction
      });

      if (existing) {
        await transaction.rollback();
        return res.status(409).json({
          error: 'Room with this name already exists'
        });
      }
    }

    await room.update(
      {
        name: name ?? room.name,
        type: type ?? room.type,
        capacity: capacity ?? room.capacity,
        creditsPerHour: creditsPerHour ?? room.creditsPerHour,
        location: location ?? room.location,
        amenities: amenities ?? room.amenities
      },
      { transaction }
    );

    await transaction.commit();
    return res.json({ ok: true, room });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findByPk(id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const hasFutureBookings = await Booking.findOne({
      where: {
        startTime: { [Op.gt]: new Date() },
        status: { [Op.in]: ['CONFIRMED', 'PENDING'] }
      },
      include: [
        {
          model: Room,
          where: { id },
          through: { attributes: [] }
        }
      ]
    });

    if (hasFutureBookings) {
      return res.status(400).json({
        error: 'Cannot delete room with future bookings'
      });
    }

    await room.destroy();

    return res.json({
      ok: true,
      message: 'Room deleted successfully'
    });
  } catch (err) {
    console.error('Delete room error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// const getDepartmentDetails = async (req, res) => {
//   const user = await User.findByPk(req.user.id, {
//     include: {
//       model: Department,
//       attributes: ['id', 'name']
//     }
//   });

//   if (!user) {
//     return res.status(404).json({ error: 'User not found' });
//   }

//   if (!user.Department) {
//     return res.status(400).json({
//       error: 'User is not assigned to any department'
//     });
//   }

//   // console.log('Me endpoint user:', user);
//   res.json({
//     id: user.id,
//     name: user.name,
//     // role: user.role,
//     departmentId: user.departmentId,
//     department: {
//       id: user.Department.id,
//       name: user.Department.name
//     }
//   });
// };

const checkInBooking = async (req, res) => {
  const booking = await Booking.findByPk(req.params.id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (booking.status !== 'CONFIRMED') {
    return res.status(400).json({ error: 'Cannot check-in this booking' });
  }

  booking.checkedIn = true;
  await booking.save();

  res.json({ ok: true, message: 'Checked in successfully' });
};

const checkOutBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({
        error: 'Only confirmed bookings can be checked out'
      });
    }

    if (!booking.checkedIn) {
      return res.status(400).json({
        error: 'Cannot check out without checking in'
      });
    }

    if (booking.checkedOut) {
      return res.status(400).json({
        error: 'Booking already checked out'
      });
    }

    booking.checkedOut = true;
    // booking.checkedOutAt = new Date();
    await booking.save();

    return res.json({
      ok: true,
      message: 'Checked out successfully. Room is now free.'
    });
  } catch (err) {
    console.error('Check-out error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const cancelBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const booking = await Booking.findByPk(req.params.id, { transaction: t });

    if (!booking || booking.status !== 'CONFIRMED') {
      throw new Error('Only confirmed bookings can be cancelled');
    }

    // Only owner can cancel
    if (booking.userId !== req.user.id) {
      throw new Error('Not authorized to cancel this booking');
    }

    const hoursBefore =
      (new Date(booking.startTime) - new Date()) / (1000 * 60 * 60);

    // 90% refund if cancelled 48+ hours before
    if (hoursBefore >= 48) {
      // const refund = Math.floor(booking.creditsUsed * 0.9);
      const rawRefund = Math.floor(booking.creditsUsed * 0.9);
      const refund = Math.max(1, rawRefund);
      await refundCredits(booking.departmentId, refund, t);
    }

    booking.status = 'CANCELLED';
    await booking.save({ transaction: t });

    await t.commit();
    res.json({ ok: true });
  } catch (err) {
    await t.rollback();
    res.status(400).json({ error: err.message });
  }
};

const listDepartmentBookings = async (req, res) => {
  try {
    const { departmentId } = req.query;

    if (!departmentId) {
      return res.status(400).json({ message: 'Department is required' });
    }

    const bookings = await Booking.findAll({
      where: { departmentId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        },
        {
          model: Room,
          attributes: ['id', 'name', 'type'],
          through: { attributes: [] }
        },
        {
          model: Resource,
          attributes: ['id', 'name'],
          through: { attributes: ['quantity'] }
        }
      ],
      order: [['startTime', 'ASC']]
    });

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to list departments booking' });
  }
};

const listDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      where: { isActive: true },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });

    res.json(departments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load departments' });
  }
};

export default {
  createBooking,
  listBookings,
  getBooking,
  createRoom,
  updateRoom,
  toggleRoomStatus,
  deleteRoom,
  // getDepartmentDetails,
  checkInBooking,
  checkOutBooking,
  cancelBooking,
  listDepartmentBookings,
  listDepartments
};
