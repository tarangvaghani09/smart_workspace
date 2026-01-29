// Routes configuration
import express from 'express';
import seedController from './controllers/seedController.js';
import authRoutes from './routes/auth.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import adminRoutes from './routes/admin.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import searchRoutes from './routes/search.routes.js';

const router = express.Router();

router.post('/seed', seedController.seedAll);
router.use(authRoutes);
router.use(adminRoutes);
router.use(bookingRoutes);
router.use(resourceRoutes);
router.use(searchRoutes);

export default router;
