// Booking controller
import {
  Booking,
  Room,
  Resource,
  BookingResource,
  sequelize,
  User,
  Department,
  RoomResourceInventory
} from '../models/index.js';

import { v4 as uuidv4 } from 'uuid';
import { Op, ValidationError, UniqueConstraintError, QueryTypes } from 'sequelize';
import moment from 'moment-timezone';
import { lockCredits, deductCredits, refundCredits } from '../services/creditService.js';
import { createBookingSchema } from '../validators/booking.schema.js';
import { createRoomSchema, updateRoomSchema } from '../validators/room.schema.js';
import { emailQueue } from '../queues/emailQueue.js';
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

export function hoursBetween(start, end) {
  return Math.max(0, Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60))
  );
}

export function calculateCredits({ creditsPerHour }, hours, quantity = 1) {
  return hours * creditsPerHour * quantity;
}

const isWithinAllowedHours = (start, end) => {
  const startHour = start.getHours();
  const startMinutes = start.getMinutes();
  const endHour = end.getHours();
  const endMinutes = end.getMinutes();

  // Allowed window: 09:00 (inclusive) -> 17:00 (inclusive only if minutes === 0)
  const isStartValid = startHour > 9 - 1 || (startHour === 9 && startMinutes >= 0);
  const isEndValid = endHour < 17 || (endHour === 17 && endMinutes === 0);

  return isStartValid && isEndValid;
};

const parseBookingDateTime = (value, timezone = 'Asia/Kolkata') => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error('Invalid booking date/time');
    return value;
  }

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Invalid booking date/time');
  }

  const raw = value.trim();

  // ISO with timezone
  const isoWithZone = raw.includes('Z') || /[+-]\d{2}:\d{2}$/.test(raw);
  if (isoWithZone) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // Local-like formats interpreted in the supplied timezone.
  const m = moment.tz(
    raw,
    [
      'YYYY-MM-DDThh:mm A',
      'YYYY-MM-DDTHH:mm A',
      'YYYY-MM-DD hh:mm A',
      'YYYY-MM-DD HH:mm A',
      'YYYY-MM-DDTH:mm',
      'YYYY-MM-DDTHH:mm',
      'YYYY-MM-DD H:mm',
      'YYYY-MM-DD HH:mm',
      'YYYY-MM-DDTHH:mm:ss',
      'YYYY-MM-DD HH:mm:ss',
      moment.ISO_8601
    ],
    true,
    timezone || 'Asia/Kolkata'
  );

  if (!m.isValid()) {
    throw new Error('Invalid booking date/time format');
  }

  return m.toDate();
};

/* ---------- helper: compute reserved quantity inside target room for a time slice ---------- */
const getReservedQtyInRoom = async (
  BookingResource,
  Booking,
  resourceId,
  roomId,
  start,
  end,
  t
) => {
  // Only count resources reserved for this room in overlapping bookings.
  // Outgoing lends are already reflected in currentAvailable when allocation happens.
  const reserved = await BookingResource.sum('quantity', {
    where: {
      resourceId,
      toRoomId: roomId
    },
    include: [
      {
        model: Booking,
        attributes: [],
        where: {
          status: { [Op.in]: ['CONFIRMED', 'PENDING'] },
          checkedOut: false,
          startTime: { [Op.lt]: end },
          endTime: { [Op.gt]: start }
        }
      }
    ],
    transaction: t
  });

  return reserved || 0;
};

const getFreeQtyFromRoomForWindow = async (
  BookingResource,
  Booking,
  inventory,
  resourceId,
  start,
  end,
  t
) => {
  const reservedQty = await getReservedQtyInRoom(
    BookingResource,
    Booking,
    resourceId,
    inventory.roomId,
    start,
    end,
    t
  );

  return Math.max(0, (inventory.currentAvailable || 0) - reservedQty);
};

// For source-room availability (donors / resource-only), reconstruct base stock and
// subtract only overlapping reservations sourced from that room.
const getReservedQtyFromSourceRoom = async (
  BookingResource,
  Booking,
  resourceId,
  roomId,
  start,
  end,
  t
) => {
  const whereReservation = {
    resourceId,
    fromRoomId: roomId
  };

  const reserved = await BookingResource.sum('quantity', {
    where: whereReservation,
    include: [
      {
        model: Booking,
        attributes: [],
        where: {
          status: { [Op.in]: ['CONFIRMED', 'PENDING'] },
          checkedOut: false,
          startTime: { [Op.lt]: end },
          endTime: { [Op.gt]: start }
        }
      }
    ],
    transaction: t
  });

  return reserved || 0;
};

const getDeductedActiveQtyFromSourceRoom = async (
  BookingResource,
  Booking,
  resourceId,
  roomId,
  t
) => {
  const deducted = await BookingResource.sum('quantity', {
    where: {
      resourceId,
      fromRoomId: roomId,
      [Op.or]: [
        { toRoomId: null },
        { toRoomId: { [Op.ne]: roomId } }
      ]
    },
    include: [
      {
        model: Booking,
        attributes: [],
        where: {
          status: { [Op.in]: ['CONFIRMED', 'PENDING'] },
          checkedOut: false
        }
      }
    ],
    transaction: t
  });

  return deducted || 0;
};

const getFreeQtyFromSourceRoomForWindow = async (
  BookingResource,
  Booking,
  inventory,
  resourceId,
  start,
  end,
  t
) => {
  const reservedOverlap = await getReservedQtyFromSourceRoom(
    BookingResource,
    Booking,
    resourceId,
    inventory.roomId,
    start,
    end,
    t
  );

  const deductedActive = await getDeductedActiveQtyFromSourceRoom(
    BookingResource,
    Booking,
    resourceId,
    inventory.roomId,
    t
  );
  const baseStock = (inventory.currentAvailable || 0) + deductedActive;

  return Math.max(0, baseStock - reservedOverlap);
};

/* ---------- isRoomAvailable ---------- */
const isRoomAvailable = async (Room, Booking, roomId, start, end, t) => {
  if (!roomId) return true;

  const room = await Room.findByPk(roomId, { transaction: t, lock: t.LOCK.UPDATE });
  if (!room) return { ok: false, reason: 'Selected room not found' };
  if (!room.isActive) return { ok: false, reason: 'Selected room is deactivated' };

  const conflict = await Booking.findOne({
    where: {
      roomId,
      status: { [Op.in]: ['CONFIRMED', 'PENDING'] },
      checkedOut: false,
      startTime: { [Op.lt]: end },
      endTime: { [Op.gt]: start }
    },
    transaction: t,
    lock: t.LOCK.UPDATE
  });

  if (conflict) return { ok: false, reason: 'Selected room is not available for the chosen slot' };
  return { ok: true };
};

/* ---------- isResourceAvailable - returns object { ok, reason } ---------- */
const isResourceAvailable = async (
  models,
  resourceId,
  qty,
  roomId,
  start,
  end,
  t
) => {
  const {
    Resource,
    Room,
    Booking,
    BookingResource,
    RoomResourceInventory
  } = models;

  // Resource row
  const resource = await Resource.findByPk(resourceId, {
    transaction: t,
    lock: t.LOCK.UPDATE
  });

  if (!resource || !resource.isActive) {
    return { ok: false, reason: 'Resource not available' };
  }

  if (!resource.isMovable) {
    return { ok: false, reason: 'Non-movable resource cannot be booked' };
  }

  // 1) GLOBAL LIMIT:
  // Only block when total overlapping usage would exceed total resource stock.
  // Example: quantity=10, overlapping=1, request=5 => allowed (1+5<=10).
  const overlappingQty = await BookingResource.sum('quantity', {
    where: { resourceId },
    include: [{
      model: Booking,
      attributes: [],
      where: {
        status: { [Op.in]: ['CONFIRMED', 'PENDING'] },
        checkedOut: false,
        startTime: { [Op.lt]: end },
        endTime: { [Op.gt]: start }
      }
    }],
    transaction: t
  });

  if ((overlappingQty || 0) + qty > resource.quantity) {
    return { ok: false, reason: 'Not enough total units of this resource exist' };
  }

  // 2) RESOURCE-ONLY:
  // Availability is based on time overlap, but stock must still come from room inventories.
  if (!roomId) {
    const inventories = await RoomResourceInventory.findAll({
      include: [{
        model: Room,
        where: { isActive: true },
        attributes: []
      }],
      where: { resourceId },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    let freeTotal = 0;
    for (const inv of inventories) {
      const freeQty = await getFreeQtyFromSourceRoomForWindow(
        BookingResource,
        Booking,
        inv,
        resourceId,
        start,
        end,
        t
      );
      freeTotal += freeQty;
      if (freeTotal >= qty) {
        return { ok: true };
      }
    }

    return { ok: false, reason: 'Insufficient free units across rooms for chosen time' };
  }

  // 2) If booking targets a room, ensure capacity not exceeded (maxCapacity is physical cap)
  let remainingToBorrow = qty;
  if (roomId) {
    const target = await RoomResourceInventory.findOne({
      where: { roomId, resourceId },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!target) {
      return { ok: false, reason: 'Target room inventory row missing' };
    }

    // Hard capacity rule: room can request up to its max capacity (<= maxCapacity).
    if (qty > target.maxCapacity) {
      return { ok: false, reason: 'Requested quantity exceeds room max capacity' };
    }

    // Use this room's own free units first (no borrowing needed for these units).
    const targetFree = await getFreeQtyFromRoomForWindow(
      BookingResource,
      Booking,
      target,
      resourceId,
      start,
      end,
      t
    );

    const selfConsumable = Math.min(targetFree, qty);
    remainingToBorrow = qty - selfConsumable;

    if (remainingToBorrow <= 0) {
      return { ok: true };
    }
  }

  // 3) SPARE: sum only spare rooms' free qty for this time window
  const spareInventories = await RoomResourceInventory.findAll({
    include: [{
      model: Room,
      where: {
        type: 'spare',
        isActive: true,
        ...(roomId && { id: { [Op.ne]: roomId } })
      },
      attributes: []
    }],
    where: { resourceId },
    transaction: t,
    lock: t.LOCK.UPDATE
  });

  let spareAvailable = 0;
  for (const inv of spareInventories) {
    const freeQty = await getFreeQtyFromSourceRoomForWindow(
      BookingResource,
      Booking,
      inv,
      resourceId,
      start,
      end,
      t
    );
    spareAvailable += freeQty;
  }

  if (spareAvailable >= qty) {
    return { ok: true };
  }

  if (spareAvailable >= remainingToBorrow) {
    return { ok: true };
  }

  // 4) CHAIN BORROW: check other (non-spare) rooms for free quantity
  let borrowable = 0;

  const donorInventories = await RoomResourceInventory.findAll({
    include: [{
      model: Room,
      where: {
        type: { [Op.ne]: 'spare' },
        isActive: true,
        ...(roomId && { id: { [Op.ne]: roomId } })
      },
      attributes: []
    }],
    where: { resourceId },
    transaction: t,
    lock: t.LOCK.UPDATE
  });

  for (const inv of donorInventories) {
    const freeQty = await getFreeQtyFromSourceRoomForWindow(
      BookingResource,
      Booking,
      inv,
      resourceId,
      start,
      end,
      t
    );

    if (freeQty <= 0) continue;
    borrowable += freeQty;

    if (spareAvailable + borrowable >= remainingToBorrow) {
      return { ok: true };
    }
  }

  // nothing can fulfill the requested qty for the time window
  return { ok: false, reason: 'Insufficient free units across spare + borrowable rooms for chosen time' };
};

/* ---------- allocateResourceForBooking: performs the actual inventory moves and returns allocations ---------- */
const allocateResourceForBooking = async (
  models,
  resourceId,
  qty,
  toRoomId,
  start,
  end,
  t
) => {
  const {
    Room,
    RoomResourceInventory,
    Booking,
    BookingResource
  } = models;

  let remaining = qty;
  const allocations = [];
  let selfUsed = 0;

  // RESOURCE-ONLY: allocate from source rooms (spare first, then others), then decrease source inventory.
  if (!toRoomId) {
    const sourceInventories = await RoomResourceInventory.findAll({
      include: [{
        model: Room,
        where: { isActive: true },
        attributes: ['id', 'type']
      }],
      where: { resourceId },
      order: [['currentAvailable', 'DESC']],
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    sourceInventories.sort((a, b) => {
      const aSpare = a.Room?.type === 'spare' ? 0 : 1;
      const bSpare = b.Room?.type === 'spare' ? 0 : 1;
      if (aSpare !== bSpare) return aSpare - bSpare;
      return (Number(b.currentAvailable) || 0) - (Number(a.currentAvailable) || 0);
    });

    for (const inv of sourceInventories) {
      if (remaining <= 0) break;

      const freeQty = await getFreeQtyFromSourceRoomForWindow(
        BookingResource,
        Booking,
        inv,
        resourceId,
        start,
        end,
        t
      );
      if (freeQty <= 0) continue;

      const take = Math.min(freeQty, remaining);
      const current = Number(inv.currentAvailable) || 0;
      const deducted = Math.min(current, take);
      inv.currentAvailable = Math.max(0, current - deducted);
      await inv.save({ transaction: t });

      allocations.push({
        fromRoomId: inv.roomId,
        toRoomId: null,
        qty: take,
        deductedFromSourceQty: deducted
      });
      remaining -= take;
    }

    if (remaining > 0) {
      throw new Error('Resource not free to allocate (race or insufficient free units)');
    }

    return allocations;
  }

  // 0) Use target room's own free units first (no inventory move needed).
  if (toRoomId) {
    const target = await RoomResourceInventory.findOne({
      where: { roomId: toRoomId, resourceId },
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    if (!target) throw new Error('Target room inventory missing (allocation stage)');

    const targetFree = await getFreeQtyFromRoomForWindow(
      BookingResource,
      Booking,
      target,
      resourceId,
      start,
      end,
      t
    );

    selfUsed = Math.min(targetFree, remaining);
    if (selfUsed > 0) {
      allocations.push({
        fromRoomId: toRoomId,
        toRoomId,
        qty: selfUsed,
        deductedFromSourceQty: 0
      });
      remaining -= selfUsed;
    }
  }

  // 1) take from spare inventories first
  const spareInventories = await RoomResourceInventory.findAll({
    include: [{
      model: Room,
      where: {
        type: 'spare',
        isActive: true,
        ...(toRoomId && { id: { [Op.ne]: toRoomId } })
      },
      attributes: []
    }],
    where: {
      resourceId,
      currentAvailable: { [Op.gt]: 0 }
    },
    order: [['currentAvailable', 'DESC']], // prefer larger spares first
    transaction: t,
    lock: t.LOCK.UPDATE
  });

  for (const inv of spareInventories) {
    if (remaining <= 0) break;

    const freeQty = await getFreeQtyFromSourceRoomForWindow(
      BookingResource,
      Booking,
      inv,
      resourceId,
      start,
      end,
      t
    );
    if (freeQty <= 0) continue;

    const take = Math.min(freeQty, remaining);
    const current = Number(inv.currentAvailable) || 0;
    const deducted = Math.min(current, take);
    inv.currentAvailable = Math.max(0, current - deducted);
    await inv.save({ transaction: t });

    allocations.push({
      fromRoomId: inv.roomId,
      toRoomId,
      qty: take,
      deductedFromSourceQty: deducted
    });

    remaining -= take;
  }

  // 2) chain-borrow from other non-spare rooms that have freeQty
  if (remaining > 0) {
    const donorInventories = await RoomResourceInventory.findAll({
      include: [{
        model: Room,
        where: {
          type: { [Op.ne]: 'spare' },
          isActive: true,
          ...(toRoomId && { id: { [Op.ne]: toRoomId } })
        },
        attributes: []
      }],
      where: { resourceId },
      order: [['currentAvailable', 'DESC']],
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    for (const inv of donorInventories) {
      if (remaining <= 0) break;

      const freeQty = await getFreeQtyFromSourceRoomForWindow(
        BookingResource,
        Booking,
        inv,
        resourceId,
        start,
        end,
        t
      );

      if (freeQty <= 0) continue;

      const take = Math.min(freeQty, remaining);
      const current = Number(inv.currentAvailable) || 0;
      const deducted = Math.min(current, take);
      inv.currentAvailable = Math.max(0, current - deducted);
      await inv.save({ transaction: t });

      allocations.push({
        fromRoomId: inv.roomId,
        toRoomId,
        qty: take,
        deductedFromSourceQty: deducted
      });

      remaining -= take;
    }
  }

  if (remaining > 0) {
    // in case of race, if not enough could be allocated, rollback higher up
    throw new Error('Resource not free to allocate (race or insufficient free units)');
  }

  // 3) if toRoomId is specified, add only borrowed incoming qty to target currentAvailable
  if (toRoomId) {
    const target = await RoomResourceInventory.findOne({
      where: { roomId: toRoomId, resourceId },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!target) throw new Error('Target room inventory missing (allocation stage)');

    const borrowedIncoming = allocations
      .filter((a) => a.toRoomId && a.fromRoomId !== a.toRoomId)
      .reduce((sum, a) => sum + (Number(a.deductedFromSourceQty) || 0), 0);
    target.currentAvailable += borrowedIncoming;
    // enforce maxCapacity just in case (should have been checked earlier)
    if (target.currentAvailable > target.maxCapacity) {
      throw new Error('Target room capacity exceeded while allocating');
    }
    await target.save({ transaction: t });
  }

  return allocations;
};

/* ---------- CREATE BOOKING CONTROLLER ---------- */
export const createBooking = async (req, res) => {
  const normalizedBody = (() => {
    const body = { ...(req.body || {}) };

    // roomId: allow numeric-like strings
    if (body.roomId === '' || body.roomId === null) {
      delete body.roomId;
    } else if (body.roomId !== undefined) {
      const roomIdNum = Number(body.roomId);
      if (Number.isInteger(roomIdNum)) body.roomId = roomIdNum;
    }

    // resources: allow object or array
    if (body.resources === '' || body.resources === null || body.resources === undefined) {
      body.resources = [];
    } else if (!Array.isArray(body.resources)) {
      body.resources = [body.resources];
    }

    // resource fields: allow numeric-like strings
    if (Array.isArray(body.resources)) {
      body.resources = body.resources.map((r) => {
        const rr = { ...(r || {}) };
        const resId = Number(rr.resourceId);
        const qty = Number(rr.quantity ?? 1);
        if (Number.isFinite(resId)) rr.resourceId = resId;
        if (Number.isFinite(qty)) rr.quantity = qty;
        return rr;
      });
    }

    // weeks: allow numeric-like strings
    if (body.weeks !== undefined) {
      const weeksNum = Number(body.weeks);
      if (Number.isFinite(weeksNum)) body.weeks = weeksNum;
    }

    return body;
  })();

  const parsed = createBookingSchema.safeParse(normalizedBody);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors
    });
  }

  const {
    roomId = null,
    resources: rawResources = [],
    startTime,
    endTime,
    timezone = 'Asia/Kolkata',
    title,
    recurrenceType = 'ONE_TIME',
    weeks = 1
  } = parsed.data;

  // Defensive: merge duplicate resource rows (same resourceId) to avoid duplicate allocation key conflicts.
  const resources = Object.values(
    (rawResources || []).reduce((acc, r) => {
      const key = String(r.resourceId);
      if (!acc[key]) {
        acc[key] = { resourceId: r.resourceId, quantity: r.quantity || 1 };
      } else {
        acc[key].quantity += (r.quantity || 1);
      }
      return acc;
    }, {})
  );

  const t = await sequelize.transaction();

  try {
    const user = req.user;

    if (!user || !user.departmentId) {
      await t.rollback();
      return res.status(400).json({
        error: 'User must belong to a department to create bookings'
      });
    }

    if (!roomId && resources.length === 0) {
      throw new Error('Booking must include a room or at least one resource');
    }

    /* ---------- OCCURRENCES ---------- */
    const occurrences = [];
    const baseStart = parseBookingDateTime(startTime, timezone);
    const baseEnd = parseBookingDateTime(endTime, timezone);

    for (let i = 0; i < weeks; i++) {
      const start = new Date(baseStart);
      const end = new Date(baseEnd);

      if (recurrenceType === 'WEEKLY') {
        start.setDate(start.getDate() + i * 7);
        end.setDate(end.getDate() + i * 7);
      }

      occurrences.push({ start, end });
    }

    const now = new Date();

    /* ---------- AVAILABILITY CHECK for each occurrence ---------- */
    for (const o of occurrences) {
      if (o.start < now) {
        throw new Error('Cannot book a time that has already passed');
      }
      if (o.end <= o.start) {
        throw new Error('End time must be after start time');
      }
      if (!isWithinAllowedHours(o.start, o.end)) {
        throw new Error('Bookings are allowed only between 9:00 AM and 5:00 PM');
      }

      // room availability
      if (roomId) {
        const roomAvailability = await isRoomAvailable(
          sequelize.models.Room,
          sequelize.models.Booking,
          roomId,
          o.start,
          o.end,
          t
        );
        if (!roomAvailability.ok) {
          throw new Error(roomAvailability.reason || 'Selected room is not available for the chosen slot');
        }
      }

      // resource availability (per resource)
      for (const r of resources) {
        const rQty = r.quantity || 1;
        const result = await isResourceAvailable(sequelize.models, r.resourceId, rQty, roomId, o.start, o.end, t);
        if (!result.ok) {
          // bubble up precise reason if available
          throw new Error(result.reason || 'Selected resource is not available for the chosen time');
        }
      }
    }

    /* ---------- CREDIT CALCULATION ---------- */
    let totalCredits = 0;
    let room = null;

    for (const o of occurrences) {
      const hours = hoursBetween(o.start, o.end);

      if (roomId) {
        room = room || await sequelize.models.Room.findByPk(roomId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!room) throw new Error('Selected room not found');
        if (!room.isActive) throw new Error('Selected room is deactivated');

        totalCredits += calculateCredits(room, hours, 1);
      }

      for (const r of resources) {
        const resource = await sequelize.models.Resource.findByPk(r.resourceId, { transaction: t });
        if (!resource || !resource.isActive) throw new Error('Resource not available');
        totalCredits += calculateCredits(resource, hours, r.quantity || 1);
      }
    }

    /* ---------- APPROVAL / CREDIT DEDUCTION ---------- */
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

    /* ---------- CREATE BOOKINGS (and allocate resources) ---------- */
    const groupId = recurrenceType === 'WEEKLY' ? uuidv4() : null;
    const bookings = [];

    for (const o of occurrences) {
      const hours = hoursBetween(o.start, o.end);
      let bookingCredits = 0;

      if (room) bookingCredits += calculateCredits(room, hours, 1);
      for (const r of resources) {
        const resource = await sequelize.models.Resource.findByPk(r.resourceId, { transaction: t });
        bookingCredits += calculateCredits(resource, hours, r.quantity || 1);
      }

      const booking = await sequelize.models.Booking.create({
        uid: uuidv4(),
        title,
        bookingType,
        roomId,
        userId: user.id,
        departmentId: user.departmentId,
        startTime: o.start,
        endTime: o.end,
        status: requiresApproval ? 'PENDING' : 'CONFIRMED',
        creditsUsed: bookingCredits,
        isRecurring: recurrenceType === 'WEEKLY',
        recurringGroup: groupId
      }, { transaction: t });

      // RESOURCE allocations & BookingResource creation
      for (const r of resources) {
        const rQty = r.quantity || 1;

        // allocateResourceForBooking will throw if not possible (race)
        const allocations = await allocateResourceForBooking(
          sequelize.models,
          r.resourceId,
          rQty,
          roomId,
          o.start,
          o.end,
          t
        );

        // persist allocations as BookingResource rows
        for (const a of allocations) {
          await sequelize.models.BookingResource.create({
            bookingId: booking.id,
            resourceId: r.resourceId,
            quantity: a.qty,
            deductedFromSourceQty: a.deductedFromSourceQty || 0,
            fromRoomId: a.fromRoomId,
            toRoomId: a.toRoomId || null,
            startTime: o.start,
            endTime: o.end
          }, { transaction: t });
        }

        // if no allocation entries were created (shouldn't happen) guard:
        const sumAllocated = allocations.reduce((s, x) => s + x.qty, 0);
        if (sumAllocated !== rQty) {
          throw new Error('Allocation mismatch: allocated qty does not equal requested qty');
        }
      }

      bookings.push(booking);
    }

    await t.commit();

    /* ---------- send email tasks after commit ---------- */
    for (const b of bookings) {
      if (b.status === 'CONFIRMED') {
        await emailQueue.add('booking-confirmed', { bookingId: b.id });
      }
    }

    return res.json({ ok: true, count: bookings.length, bookings });
  } catch (err) {
    if (!t.finished) {
      await t.rollback();
    }
    if (err instanceof UniqueConstraintError) {
      const detail = err.errors?.map((e) => e.message).join(', ') || err.message;
      if (/bookingId must be unique|resourceId must be unique/i.test(detail)) {
        return res.status(400).json({
          error: 'Booking resource schema mismatch',
          detail: 'booking_resources table has wrong unique indexes. Keep only composite unique index on (bookingId, resourceId, fromRoomId, toRoomId).'
        });
      }
      return res.status(400).json({
        error: 'Validation error',
        detail
      });
    }
    if (err instanceof ValidationError) {
      return res.status(400).json({
        error: 'Validation error',
        detail: err.errors?.map((e) => e.message).join(', ') || err.message
      });
    }
    return res.status(400).json({ error: err.message });
  }
};

const listBookings = async (req, res) => {
  const user = req.user;

  const bookings = await Booking.findAll({
    where: { userId: user.id },

    include: [
      {
        model: Room,
        attributes: ['id', 'name', 'type']
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

  const withTotals = await attachAggregatedResources(bookings);
  return res.json(withTotals);
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

  const withTotals = await attachAggregatedResources([booking]);
  return res.json(withTotals[0] || booking);
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
    return res.json({
      ok: true,
      message: 'Room toggled successfully'
    });
  } catch (err) {
    console.error('Toggle room error:', err);
    return res.status(500).json({ error: err.message });
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
        roomId: id,
        startTime: { [Op.gt]: new Date() },
        status: { [Op.in]: ['CONFIRMED', 'PENDING'] }
      }
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

  return res.json({ ok: true, message: 'Checked in successfully' });
};

const checkOutBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const booking = await Booking.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });

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

    // FREE RESOURCES
    await returnResourcesForBooking(booking.id, t);

    booking.checkedOut = true;
    // booking.checkedOutAt = new Date();
    await booking.save({ transaction: t });

    await t.commit();
    return res.json({
      ok: true,
      message: 'Checked out successfully. Room is now free.'
    });
  } catch (err) {
    await t.rollback();
    console.error('Check-out error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const cancelBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const booking = await Booking.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!booking || booking.status !== 'CONFIRMED') {
      throw new Error('Only confirmed bookings can be cancelled');
    }

    // Only owner can cancel
    if (booking.userId !== req.user.id) {
      throw new Error('Not authorized to cancel this booking');
    }

    if (booking.checkedOut) {
      throw new Error('Booking resources already returned');
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

    // FREE RESOURCES
    await returnResourcesForBooking(booking.id, t);

    booking.status = 'CANCELLED';
    // booking.checkedOut = true;
    await booking.save({ transaction: t });

    await t.commit();
    return res.json({ ok: true });
  } catch (err) {
    await t.rollback();
    return res.status(400).json({ error: err.message });
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
          attributes: ['id', 'name', 'type']
        },
        {
          model: Resource,
          attributes: ['id', 'name'],
          through: { attributes: ['quantity'] }
        }
      ],
      order: [['startTime', 'ASC']]
    });

    const withTotals = await attachAggregatedResources(bookings);
    return res.json(withTotals);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to list departments booking' });
  }
};

const listDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      where: { isActive: true },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });

    return res.json(departments);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to load departments' });
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
  checkInBooking,
  checkOutBooking,
  cancelBooking,
  listDepartmentBookings,
  listDepartments
};
