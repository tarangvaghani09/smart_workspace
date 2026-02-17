import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
import { Worker } from 'bullmq';
import connection from '../queues/redis.js';
import emailService from '../services/emailService.js';

console.log('Email worker starting...');

console.log('ENV CHECK', {
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME
});

const worker = new Worker(
  'email-queue',
  async (job) => {
    const { bookingId } = job.data || {};

    console.log(`Processing ${job.name}`, bookingId ? `for booking ${bookingId}` : '');

    if (job.name === 'booking-confirmed') {
      await emailService.sendBookingConfirmationEmail(bookingId);
      console.log(`📧 CONFIRMATION email sent for booking ${bookingId}`);
      return;
    }

    if (job.name === 'booking-rejected') {
      await emailService.sendBookingRejectedEmail(bookingId);
      console.log(`📧 REJECTION email sent for booking ${bookingId}`);
      return;
    }

    if (job.name === 'booking-no-show') {
      await emailService.sendNoShowNotificationEmail(bookingId);
      console.log(`📧 NO_SHOW email sent for booking ${bookingId}`);
      return;
    }

    if (job.name === 'password-reset') {
      await emailService.sendPasswordResetEmail(job.data || {});
      console.log(`📧 PASSWORD_RESET email sent to ${job.data?.to}`);
      return;
    }

    console.warn(`📧 Unhandled email job type: ${job.name}`);
  },
  {
    connection,
    concurrency: 10
  }
);

// worker.on('completed', (job) => {
//   if (job.data?.bookingId) {
//     console.log(`📧 Email sent for booking ${job.data.bookingId}`);
//     return;
//   }
//   console.log(`📧 Email job completed (${job.name})`);
// });

worker.on('failed', (job, err) => {
  if (job?.data?.bookingId) {
    console.error(`📧 Email failed for booking ${job.data.bookingId}:`, err.message);
    return;
  }
  console.error(`Email job failed (${job?.name}):`, err.message);
});
