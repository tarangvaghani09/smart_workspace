// allocateResourcesManual.js
import { sequelize, Room, Resource, RoomResourceInventory } from '../models/index.js';

// Manual allocation map
const manualAllocations = {
  2: { // Room 1
    1: { maxCapacity: 10, currentAvailable: 6 },
    2: { maxCapacity: 8, currentAvailable: 4 },
    3: { maxCapacity: 2, currentAvailable: 1 }
  },
  3: { // Room 2
    1: { maxCapacity: 5, currentAvailable: 3 },
    2: { maxCapacity: 2, currentAvailable: 1 },
    3: { maxCapacity: 1, currentAvailable: 0 }
  },
  4: { // Room 3
    1: { maxCapacity: 3, currentAvailable: 1 },
    2: { maxCapacity: 5, currentAvailable: 4 },
    3: { maxCapacity: 1, currentAvailable: 1 }
  }
};

async function initManualAllocation() {
  const t = await sequelize.transaction();

  try {
    // Fetch all active movable resources
    const resources = await Resource.findAll({
      where: { isActive: true, isMovable: true },
      transaction: t
    });

    // Fetch all active rooms
    const rooms = await Room.findAll({ where: { isActive: true }, transaction: t });

    // Find default/spare room
    const defaultRoom = rooms.find(r => r.isDefaultLocation) || null;

    for (const resource of resources) {
      let totalAllocated = 0;

      console.log(`\n📦 Allocating resource "${resource.name}" (Total Quantity: ${resource.quantity})`);

      // Apply manual allocations for each room
      for (const room of rooms) {
        if (room.isDefaultLocation) continue;

        const roomAlloc = manualAllocations[room.id]?.[resource.id];
        if (!roomAlloc) continue; // nothing allocated manually

        const { maxCapacity, currentAvailable } = roomAlloc;

        // Update or create RoomResourceInventory
        const existing = await RoomResourceInventory.findOne({
          where: { roomId: room.id, resourceId: resource.id },
          transaction: t
        });

        if (existing) {
          await existing.update(
            { maxCapacity, currentAvailable },
            { transaction: t }
          );
        } else {
          await RoomResourceInventory.create(
            { roomId: room.id, resourceId: resource.id, maxCapacity, currentAvailable },
            { transaction: t }
          );
        }

        totalAllocated += currentAvailable;
        console.log(`➡️ Room "${room.name}" manually allocated ${currentAvailable} of "${resource.name}" (Max Capacity: ${maxCapacity})`);
      }

      // Remaining goes to spare/default room
      const remaining = resource.quantity - totalAllocated;

      if (defaultRoom) {
        const existingSpare = await RoomResourceInventory.findOne({
          where: { roomId: defaultRoom.id, resourceId: resource.id },
          transaction: t
        });

        if (existingSpare) {
          await existingSpare.update(
            { maxCapacity: resource.quantity, currentAvailable: remaining },
            { transaction: t }
          );
        } else {
          await RoomResourceInventory.create(
            { roomId: defaultRoom.id, resourceId: resource.id, maxCapacity: resource.quantity, currentAvailable: remaining },
            { transaction: t }
          );
        }

        console.log(`🛏️ Spare room "${defaultRoom.name}" gets remaining ${remaining} of "${resource.name}"`);
      } else {
        console.log(`⚠️ No spare room found. Remaining ${remaining} of "${resource.name}" cannot be allocated.`);
      }
    }

    await t.commit();
    console.log('✅ Manual allocation completed successfully.');
  } catch (err) {
    await t.rollback();
    console.error('❌ Error in manual allocation:', err);
  }
}

initManualAllocation();
