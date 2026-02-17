import { Resource, Room, RoomResourceInventory, Booking, BookingResource, sequelize } from '../models/index.js';
import { createResourceSchema, updateResourceSchema } from '../validators/resource.schema.js';
import { Op } from 'sequelize';

/*--------------- List all active resources -------------*/

const listResources = async (req, res) => {
  try {
    const roomIdRaw = req.query.roomId;
    const roomId = roomIdRaw !== undefined ? Number(roomIdRaw) : null;
    const startTimeRaw = req.query.startTime;
    const endTimeRaw = req.query.endTime;

    const resources = await Resource.findAll({
      where: { isActive: true, isMovable: true },
      attributes: ['id', 'name', 'quantity', 'creditsPerHour', 'isMovable', 'isActive'],
      order: [['name', 'ASC']]
    });

    const resourceIds = resources.map((r) => r.id);
    const hasWindow = Boolean(startTimeRaw && endTimeRaw);
    const startTime = hasWindow ? new Date(startTimeRaw) : null;
    const endTime = hasWindow ? new Date(endTimeRaw) : null;
    const hasValidWindow =
      hasWindow &&
      startTime instanceof Date &&
      endTime instanceof Date &&
      !Number.isNaN(startTime.getTime()) &&
      !Number.isNaN(endTime.getTime()) &&
      endTime > startTime;

    const bookedByResourceId = new Map();
    const bookedOnlyByResourceId = new Map();
    const lockedByResourceId = new Map();
    const lockedByResourceRoom = new Map();
    const activeDeductedByResourceRoom = new Map();

    if (hasValidWindow && resourceIds.length > 0) {
      const bookedRows = await BookingResource.findAll({
        where: { resourceId: { [Op.in]: resourceIds } },
        attributes: [
          'resourceId',
          [sequelize.fn('SUM', sequelize.col('BookingResource.quantity')), 'bookedQty']
        ],
        include: [
          {
            model: Booking,
            attributes: [],
            required: true,
            where: {
              status: { [Op.in]: ['CONFIRMED', 'PENDING'] },
              checkedOut: false,
              startTime: { [Op.lt]: endTime },
              endTime: { [Op.gt]: startTime }
            }
          }
        ],
        group: ['resourceId']
      });

      for (const row of bookedRows) {
        const resourceId = Number(row.resourceId);
        const bookedQty = Number(row.get('bookedQty')) || 0;
        bookedByResourceId.set(resourceId, bookedQty);
      }

      const lockTotals = await BookingResource.findAll({
        where: {
          resourceId: { [Op.in]: resourceIds }
        },
        attributes: [
          'resourceId',
          [sequelize.fn('SUM', sequelize.col('BookingResource.quantity')), 'lockedQty']
        ],
        include: [
          {
            model: Booking,
            attributes: [],
            required: true,
            where: {
              status: { [Op.in]: ['CONFIRMED', 'PENDING'] },
              checkedOut: false,
              startTime: { [Op.lt]: endTime },
              endTime: { [Op.gt]: startTime }
            }
          }
        ],
        group: ['resourceId']
      });

      for (const row of lockTotals) {
        const resourceId = Number(row.resourceId);
        const lockedQty = Number(row.get('lockedQty')) || 0;
        lockedByResourceId.set(resourceId, lockedQty);
      }

      const lockRoomTotals = await BookingResource.findAll({
        where: {
          resourceId: { [Op.in]: resourceIds },
          fromRoomId: { [Op.ne]: null }
        },
        attributes: [
          'resourceId',
          'fromRoomId',
          [sequelize.fn('SUM', sequelize.col('BookingResource.quantity')), 'lockedQty']
        ],
        include: [
          {
            model: Booking,
            attributes: [],
            required: true,
            where: {
              status: { [Op.in]: ['CONFIRMED', 'PENDING'] },
              checkedOut: false,
              startTime: { [Op.lt]: endTime },
              endTime: { [Op.gt]: startTime }
            }
          }
        ],
        group: ['resourceId', 'fromRoomId']
      });

      for (const row of lockRoomTotals) {
        const resourceId = Number(row.resourceId);
        const lockRoomId = Number(row.fromRoomId);
        const lockedQty = Number(row.get('lockedQty')) || 0;
        lockedByResourceRoom.set(`${resourceId}:${lockRoomId}`, lockedQty);
      }

      const activeSourceRows = await BookingResource.findAll({
        where: {
          resourceId: { [Op.in]: resourceIds },
          fromRoomId: { [Op.ne]: null }
        },
        attributes: ['resourceId', 'fromRoomId', 'toRoomId', 'quantity'],
        include: [
          {
            model: Booking,
            attributes: [],
            required: true,
            where: {
              status: { [Op.in]: ['CONFIRMED', 'PENDING'] },
              checkedOut: false
            }
          }
        ]
      });

      for (const row of activeSourceRows) {
        const resourceId = Number(row.resourceId);
        const fromRoomId = Number(row.fromRoomId);
        const toRoomId = row.toRoomId === null ? null : Number(row.toRoomId);
        if (!fromRoomId) continue;
        if (toRoomId !== null && toRoomId === fromRoomId) continue;

        const key = `${resourceId}:${fromRoomId}`;
        const qty = Number(row.quantity) || 0;
        activeDeductedByResourceRoom.set(
          key,
          (activeDeductedByResourceRoom.get(key) || 0) + qty
        );
      }

      const bookedOnlyRows = await BookingResource.findAll({
        where: {
          resourceId: { [Op.in]: resourceIds },
          toRoomId: null
        },
        attributes: [
          'resourceId',
          [sequelize.fn('SUM', sequelize.col('BookingResource.quantity')), 'bookedOnlyQty']
        ],
        include: [
          {
            model: Booking,
            attributes: [],
            required: true,
            where: {
              status: { [Op.in]: ['CONFIRMED', 'PENDING'] },
              checkedOut: false,
              startTime: { [Op.lt]: endTime },
              endTime: { [Op.gt]: startTime }
            }
          }
        ],
        group: ['resourceId']
      });

      for (const row of bookedOnlyRows) {
        const resourceId = Number(row.resourceId);
        const qty = Number(row.get('bookedOnlyQty')) || 0;
        bookedOnlyByResourceId.set(resourceId, qty);
      }

    }

    if (!roomId || !Number.isInteger(roomId)) {
      const enrichedWithoutRoom = resources.map((r) => {
        const bookedQty = bookedByResourceId.get(r.id) || 0;
        const bookedOnlyQty = bookedOnlyByResourceId.get(r.id) || 0;
        const bookedWithRoomQty = Math.max(0, bookedQty - bookedOnlyQty);
        const lockedQty = lockedByResourceId.get(r.id) || bookedQty;
        const totalQty = Number(r.quantity) || 0;
        const availableNow = hasValidWindow
          ? Math.max(0, totalQty - lockedQty)
          : totalQty;

        return {
          ...r.toJSON(),
          bookedQty,
          bookedOnlyResourceQty: bookedOnlyQty,
          bookedWithRoomQty,
          availableNow
        };
      });

      return res.json(enrichedWithoutRoom);
    }

    const inventories = await RoomResourceInventory.findAll({
      where: { roomId },
      attributes: ['resourceId', 'maxCapacity', 'currentAvailable']
    });

    const invByResourceId = new Map(
      inventories.map((i) => [
        i.resourceId,
        {
          maxCapacity: i.maxCapacity
        }
      ])
    );

    const enriched = resources.map((r) => {
      const inv = invByResourceId.get(r.id) || null;
      const roomMaxCapacity = inv ? inv.maxCapacity : null;
      const bookedQty = bookedByResourceId.get(r.id) || 0;
      const bookedOnlyQty = bookedOnlyByResourceId.get(r.id) || 0;
      const bookedWithRoomQty = Math.max(0, bookedQty - bookedOnlyQty);
      const lockedQty = lockedByResourceId.get(r.id) || bookedQty;
      const totalQty = Number(r.quantity) || 0;
      const globalAvailableNow = hasValidWindow
        ? Math.max(0, totalQty - lockedQty)
        : totalQty;
      const bookableNow = roomMaxCapacity === null || roomMaxCapacity === undefined
        ? globalAvailableNow
        : Math.max(0, Math.min(Number(roomMaxCapacity) || 0, globalAvailableNow));

      return {
        ...r.toJSON(),
        roomMaxCapacity,
        bookedQty,
        bookedOnlyResourceQty: bookedOnlyQty,
        bookedWithRoomQty,
        globalAvailableNow,
        availableNow: globalAvailableNow,
        bookableNow
      };
    });

    // Keep availableNow as selected-time global stock; compute bookableNow using room inventory borrow logic.
    if (hasValidWindow) {
      const donorInventories = await RoomResourceInventory.findAll({
        where: {
          roomId: { [Op.ne]: roomId },
          resourceId: { [Op.in]: resourceIds }
        },
        attributes: ['roomId', 'resourceId', 'currentAvailable'],
        include: [
          {
            model: Room,
            attributes: ['id', 'type', 'isActive'],
            required: true,
            where: { isActive: true }
          }
        ]
      });

      const donorsByResource = new Map();
      for (const inv of donorInventories) {
        if (!donorsByResource.has(inv.resourceId)) donorsByResource.set(inv.resourceId, []);
        donorsByResource.get(inv.resourceId).push(inv);
      }

      for (const item of enriched) {
        const roomCap = item.roomMaxCapacity === null || item.roomMaxCapacity === undefined
          ? null
          : Number(item.roomMaxCapacity) || 0;

        if (roomCap === null) {
          item.bookableNow = 0;
          continue;
        }

        const targetInv = inventories.find((x) => x.resourceId === item.id);
        const targetCurrent = Number(targetInv?.currentAvailable || 0);
        const targetDeducted = activeDeductedByResourceRoom.get(`${item.id}:${roomId}`) || 0;
        const targetBase = targetCurrent + targetDeducted;
        const lockedInTarget = lockedByResourceRoom.get(`${item.id}:${roomId}`) || 0;
        const ownFree = Math.max(0, targetBase - lockedInTarget);

        let spareFree = 0;
        let donorFree = 0;
        const donors = donorsByResource.get(item.id) || [];
        for (const donor of donors) {
          const current = Number(donor.currentAvailable || 0);
          const deducted = activeDeductedByResourceRoom.get(`${item.id}:${donor.roomId}`) || 0;
          const base = current + deducted;
          const lockedInDonor = lockedByResourceRoom.get(`${item.id}:${donor.roomId}`) || 0;
          const free = Math.max(0, base - lockedInDonor);
          if (free <= 0) continue;

          if (donor.Room?.type === 'spare') spareFree += free;
          else donorFree += free;
        }

        const borrowAware = ownFree + spareFree + donorFree;
        item.bookableNow = Math.max(
          0,
          Math.min(roomCap, borrowAware, Number(item.availableNow || 0))
        );
      }
    }

    return res.json(enriched);

  } catch (err) {
    console.error('List resources error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/*--------------- List all resources (ADMIN) -------------*/

const listAllResources = async (req, res) => {
  try {
    const resources = await Resource.findAll({
      attributes: ['id', 'name', 'quantity', 'creditsPerHour', 'isMovable', 'isActive'],
      order: [['isActive', 'DESC'], ['name', 'ASC']]
    });

    return res.json(resources);
  } catch (err) {
    console.error('List resources error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/*--------------- Create a new resources (ADMIN) -------------*/

const createResource = async (req, res) => {
  try {
    const result = createResourceSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }

    const { name, quantity, creditsPerHour, isMovable } = result.data;

    const existing = await Resource.findOne({ where: { name } });
    if (existing) {
      return res.status(409).json({
        error: 'Resource with this name already exists'
      });
    }

    const resource = await Resource.create({
      name,
      quantity,
      creditsPerHour,
      isMovable
    });

    return res.status(201).json({ ok: true, resource });
  } catch (err) {
    console.error('Create resource error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/*--------------- Update resources -------------*/
const updateResource = async (req, res) => {
  try {
    const parseResult = updateResourceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }

    const { name, quantity, creditsPerHour, isMovable } = parseResult.data;

    const resource = await Resource.findByPk(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Prevent duplicate name
    if (name && name !== resource.name) {
      const existing = await Resource.findOne({ where: { name } });
      if (existing) {
        return res.status(409).json({ error: 'Resource with this name already exists' });
      }
    }

    await resource.update({
      name: name ?? resource.name,
      quantity: quantity ?? resource.quantity,
      creditsPerHour: creditsPerHour ?? resource.creditsPerHour,
      isMovable: isMovable ?? resource.isMovable,
      // isActive: isActive ?? !resource.isActive
    });

    return res.json({ ok: true, resource });
  } catch (err) {
    console.error('Update resource error:', err);
    return res.status(500).json({ error: err.message });
  }
};


/*--------------- Soft delete (disable resource) -------------*/

const toggleResourceStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findByPk(id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    await resource.update({ isActive: !resource.isActive });

    return res.json({
      ok: true,
      message: 'Resource toggled successfully'
    });
  } catch (err) {
    console.error('Toggle resource error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/*--------------- delete resource -------------*/

const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findByPk(id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    await resource.destroy();

    return res.json({
      ok: true,
      message: 'Resource deleted successfully'
    });
  } catch (err) {
    console.error('Delete resource error:', err);
    return res.status(500).json({ error: err.message });
  }
};


export default {
  listResources,
  listAllResources,
  createResource,
  updateResource,
  toggleResourceStatus,
  deleteResource
};
