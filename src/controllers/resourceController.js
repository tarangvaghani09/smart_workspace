import { Resource } from '../models/index.js';

/**
 * GET /api/resources
 * List all active resources (devices)
 */
const listResources = async (req, res) => {
  try {
    const resources = await Resource.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'quantity', 'creditsPerHour', 'isActive'],
      order: [['name', 'ASC']]
    });

    res.json(resources);
  } catch (err) {
    console.error('List resources error:', err);
    res.status(500).json({ error: err.message });
  }
};

const listAllResources = async (req, res) => {
  try {
    const admin = req.user;

    if (admin.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    
    const resources = await Resource.findAll({
      attributes: ['id', 'name', 'quantity', 'creditsPerHour', 'isActive'],
      order: [['isActive', 'DESC'], ['name', 'ASC']]
    });

    res.json(resources);
  } catch (err) {
    console.error('List resources error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/resources
 * Create a new device (ADMIN)
 */
const createResource = async (req, res) => {
  try {
    const user = req.user;
    const { name, quantity = 1, creditsPerHour } = req.body;

if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Resource name required' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be >= 1' });
    }

    if (creditsPerHour <= 0) {
      return res.status(400).json({ error: 'CreditsPerHour must be >= 1' });
    }

    const existing = await Resource.findOne({ where: { name } });
    if (existing) {
      return res.status(409).json({
        error: 'Resource with this name already exists'
      });
    }

    const resource = await Resource.create({
      name,
      quantity,
      creditsPerHour
    });

    res.status(201).json({ ok: true, resource });
  } catch (err) {
    console.error('Create resource error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * PATCH /api/resources/:id
 * Update device
 */
const updateResource = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { name, quantity, creditsPerHour } = req.body;

if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const resource = await Resource.findByPk(id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (quantity !== undefined && quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be >= 1' });
    }

    if (creditsPerHour !== undefined && creditsPerHour < 0) {
      return res.status(400).json({ error: 'Credits must be >= 0' });
    }

    await resource.update({
      name: name ?? resource.name,
      quantity: quantity ?? resource.quantity,
      creditsPerHour: creditsPerHour ?? resource.creditsPerHour,
      // isActive: isActive ?? !resource.isActive
    });

    res.json({ ok: true, resource });
  } catch (err) {
    console.error('Update resource error:', err);
    res.status(500).json({ error: err.message });
  }
};


/**
 * DELETE /api/resources/:id
 * Soft delete (disable resource)
 */
const toggleResourceStatus = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const resource = await Resource.findByPk(id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    await resource.update({ isActive: !resource.isActive });

    res.json({
      ok: true,
      message: 'Resource toggled successfully'
    });
  } catch (err) {
    console.error('Toggle resource error:', err);
    res.status(500).json({ error: err.message });
  }
};

const deleteResource = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const resource = await Resource.findByPk(id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    await resource.destroy(); // 🔥 permanently delete

    res.json({
      ok: true,
      message: 'Resource deleted successfully'
    });
  } catch (err) {
    console.error('Delete resource error:', err);
    res.status(500).json({ error: err.message });
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
