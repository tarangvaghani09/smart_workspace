import express from 'express';
import auth from '../middleware/auth.js';
import authController from '../controllers/authController.js';
import { forgotPasswordLimiter, loginLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validators/auth.schema.js';

const router = express.Router();

router.post('/login', loginLimiter, authController.login);
router.post('/register', loginLimiter, authController.register);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password', forgotPasswordLimiter, authController.resetPassword);
router.patch('/change-password', auth, authController.changePassword);
router.get('/me', auth, authController.getMe);

export default router;
