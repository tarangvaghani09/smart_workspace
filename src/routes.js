// Routes configuration
import express from 'express';
import auth from './middleware/auth.js';
import bookingController from './controllers/bookingController.js';
import searchController from './controllers/searchController.js';
import approvalController from './controllers/approvalController.js';
import seedController from './controllers/seedController.js';
import authController from './controllers/authController.js';
import cancelController from './controllers/cancelController.js';
import resourceController from './controllers/resourceController.js';
import { requireAdmin } from './middleware/requireAdmin.js';
import { adminLimiter, loginLimiter } from './middleware/rateLimiter.js';
import { validate } from './middleware/validate.js';
import { loginSchema, registerSchema } from './validators/auth.schema.js';
import { bookingSchema } from './validators/booking.schema.js';
import { createRoomSchema } from './validators/room.schema.js';
import { createResourceSchema } from './validators/resource.schema.js';

const router = express.Router();

router.post('/seed', seedController.seedAll);

/* =====================================================
   AUTH
===================================================== */
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/register', loginLimiter, validate(registerSchema), authController.register);

/* =====================================================
   USER – BOOKINGS
===================================================== */
router.post('/bookings', auth,  bookingController.createBooking);
router.get('/bookings', auth, bookingController.listBookings);


/* =====================================================
   ADMIN / MANAGER
===================================================== */

// Get all bookings department wise
router.get('/bookings/department', auth, requireAdmin, adminLimiter, bookingController.listDepartmentBookings);
router.get('/departments', bookingController.listDepartments );

// ===================================================== */

router.get('/bookings/:id', auth, bookingController.getBooking);

// check-in / check-out / cancel
router.post('/bookings/:id/check-in', auth, bookingController.checkInBooking);
router.post('/bookings/:id/check-out', auth, bookingController.checkOutBooking);
router.post('/bookings/:id/cancel', auth, cancelController.cancelBooking);

/* =====================================================
   USER – CREDITS / DEPARTMENT
===================================================== */
router.get('/credits', auth, bookingController.getCredits);
router.get('/getDepartmentDetails', auth, bookingController.getDepartmentDetails);

/* =====================================================
   USER – SEARCH / RESOURCES
===================================================== */
router.post('/search/rooms', auth, searchController.searchRooms);
router.get('/resources', auth, resourceController.listResources);


/* =====================================================
   ADMIN / MANAGER
===================================================== */

// Room management
router.post('/rooms', auth, requireAdmin, adminLimiter, validate(createRoomSchema), bookingController.createRoom);
router.put('/rooms/:id', auth, requireAdmin, adminLimiter, bookingController.updateRoom);
router.delete('/rooms/:id', auth, requireAdmin, adminLimiter, bookingController.deleteRoom);

// Approval workflow
router.get('/approvals/pending', auth, requireAdmin, adminLimiter, approvalController.getPendingBookings);
router.post('/approve-booking', auth, requireAdmin, adminLimiter, approvalController.approveBooking);
// router.post('/reject-booking', auth, approvalController.rejectBooking);

// Resource management
router.get('/listAllResources', auth, requireAdmin, adminLimiter, resourceController.listAllResources);
router.post('/resources', auth, requireAdmin, adminLimiter, validate(createResourceSchema), resourceController.createResource);
router.patch('/resources/:id', auth, requireAdmin, adminLimiter, resourceController.updateResource);
router.patch('/resources/:id/status', auth, requireAdmin, adminLimiter, resourceController.toggleResourceStatus);
router.delete('/resources/:id', auth, requireAdmin, adminLimiter, resourceController.deleteResource);

export default router;
