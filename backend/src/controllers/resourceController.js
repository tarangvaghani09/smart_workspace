import { Resource } from '../models/index.js';
import { createResourceSchema, updateResourceSchema } from '../validators/resource.schema.js';

/**
 * List all active resources
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
 * Create a new resources (ADMIN)
 */
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

    const { name, quantity, creditsPerHour, isActive } = result.data;

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
 * Update resources
 */
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

    const { name, quantity, creditsPerHour } = parseResult.data;

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
      // isActive: isActive ?? !resource.isActive
    });

    res.json({ ok: true, resource });
  } catch (err) {
    console.error('Update resource error:', err);
    res.status(500).json({ error: err.message });
  }
};


/**
 * Soft delete (disable resource)
 */
const toggleResourceStatus = async (req, res) => {
  try {
    const { id } = req.params;

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

/**
 * delete resource
 */

const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;

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
