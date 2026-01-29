import express from 'express';
import auth from '../middleware/auth.js';
import resourceController from '../controllers/resourceController.js';

const router = express.Router();

router.get('/resources', auth, resourceController.listResources);

export default router;
