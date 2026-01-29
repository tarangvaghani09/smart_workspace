import express from 'express';
import auth from '../middleware/auth.js';
import approvalController from '../controllers/approvalController.js';
import resourceController from '../controllers/resourceController.js';
import bookingController from '../controllers/bookingController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { adminLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Get all bookings department wise
router.get('/bookings/department', auth, requireAdmin, adminLimiter, bookingController.listDepartmentBookings);

// Room management
router.post('/rooms', auth, requireAdmin, adminLimiter, bookingController.createRoom);
router.put('/rooms/:id', auth, requireAdmin, adminLimiter, bookingController.updateRoom);
router.delete('/rooms/:id', auth, requireAdmin, adminLimiter, bookingController.deleteRoom);

// Approval workflow
router.get('/approvals/pending', auth, requireAdmin, adminLimiter, approvalController.getPendingBookings);
router.post('/approve-booking', auth, requireAdmin, adminLimiter, approvalController.approveBooking);
// router.post('/reject-booking', auth, approvalController.rejectBooking);

// Resource management
router.get('/listAllResources', auth, requireAdmin, adminLimiter, resourceController.listAllResources);
router.post('/resources', auth, requireAdmin, adminLimiter, resourceController.createResource);
router.patch('/resources/:id', auth, requireAdmin, adminLimiter, resourceController.updateResource);
router.patch('/resources/:id/status', auth, requireAdmin, adminLimiter, resourceController.toggleResourceStatus);
router.delete('/resources/:id', auth, requireAdmin, adminLimiter, resourceController.deleteResource);

export default router;
