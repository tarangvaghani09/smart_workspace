import express from 'express';
import auth from '../middleware/auth.js';
import authController from '../controllers/authController.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validators/auth.schema.js';

const router = express.Router();

router.post('/login', loginLimiter, authController.login);
router.post('/register', loginLimiter, authController.register);
router.get('/me', auth, authController.getMe);

export default router;
