import { BookingResource, RoomResourceInventory } from '../models/index.js';

export const returnResourcesForBooking = async (bookingId, transaction) => {
  const rows = await BookingResource.findAll({
    where: { bookingId },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined
  });

  // Aggregate updates by room/resource to avoid per-row ordering conflicts.
  const deltas = new Map(); // key => { roomId, resourceId, delta }

  const bump = (roomId, resourceId, delta) => {
    const key = `${roomId}:${resourceId}`;
    const prev = deltas.get(key);
    deltas.set(key, {
      roomId,
      resourceId,
      delta: (prev?.delta || 0) + delta
    });
  };

  for (const row of rows) {
    const resourceId = Number(row.resourceId);
    const qty = Number(row.quantity) || 0;
    const deductedFromSourceQty = Number(row.deductedFromSourceQty);
    const effectiveReturnedQty =
      Number.isFinite(deductedFromSourceQty) && deductedFromSourceQty >= 0
        ? deductedFromSourceQty
        : qty;
    const fromRoomId = row.fromRoomId ? Number(row.fromRoomId) : null;
    const toRoomId = row.toRoomId ? Number(row.toRoomId) : null;

    if (!resourceId || !fromRoomId || effectiveReturnedQty <= 0) continue;

    // Resource-only booking: units were taken from source room only.
    if (!toRoomId) {
      bump(fromRoomId, resourceId, effectiveReturnedQty);
      continue;
    }

    // Own-room usage (from == to) has no movement to reverse.
    if (toRoomId === fromRoomId) {
      continue;
    }

    // Borrowed flow: remove from target room, return to source room.
    bump(toRoomId, resourceId, -effectiveReturnedQty);
    bump(fromRoomId, resourceId, effectiveReturnedQty);
  }

  for (const { roomId, resourceId, delta } of deltas.values()) {
    if (!delta) continue;

    const inventory = await RoomResourceInventory.findOne({
      where: { roomId, resourceId },
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined
    });

    if (!inventory) continue;

    const current = Number(inventory.currentAvailable) || 0;
    const maxCapacity = Number(inventory.maxCapacity) || 0;
    const next = current + delta;

    if (next < 0) {
      throw new Error(
        `Resource return conflict: room ${roomId}, resource ${resourceId} would go negative`
      );
    }

    inventory.currentAvailable = Math.min(maxCapacity, next);
    await inventory.save({ transaction });
  }
};
