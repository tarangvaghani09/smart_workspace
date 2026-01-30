// Routes configuration
import express from 'express';
import auth from '../middleware/auth.js';
import bookingController from '../controllers/bookingController.js';
import cancelController from '../controllers/creditController.js';
import { validate } from '../middleware/validate.js';
import { createBookingSchema } from '../validators/booking.schema.js';

const router = express.Router();

router.post('/bookings', auth, validate(createBookingSchema), bookingController.createBooking);
router.get('/bookings', auth, bookingController.listBookings);
router.get('/departments', bookingController.listDepartments);
router.get('/bookings/:id', auth, bookingController.getBooking);

router.post('/bookings/:id/check-in', auth, bookingController.checkInBooking);
router.post('/bookings/:id/check-out', auth, bookingController.checkOutBooking);
router.post('/bookings/:id/cancel', auth, bookingController.cancelBooking);

// router.get('/getDepartmentDetails', auth, bookingController.getDepartmentDetails);

export default router;
