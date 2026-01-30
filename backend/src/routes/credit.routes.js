// Routes configuration
import express from 'express';
import auth from '../middleware/auth.js';
import creditController from '../controllers/creditController.js';

const router = express.Router();

router.get('/credits', auth, creditController.getCredits);

export default router;
