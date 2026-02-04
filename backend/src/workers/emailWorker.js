import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
import { Worker } from 'bullmq';
import connection from '../queues/redis.js';
import emailService from '../services/emailService.js';

console.log('🚀 Email worker starting...');

console.log('ENV CHECK →', {
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME
});

const worker = new Worker(
  'email-queue',
  async job => {
    const { bookingId } = job.data;

    console.log(`📨 Processing ${job.name} for booking ${bookingId}`);

    if (job.name === 'booking-confirmed') {
      await emailService.sendBookingConfirmationEmail(bookingId);
      console.log(`📧 [CONFIRMATION] Email sent for booking ${bookingId}`)
    }

    if (job.name === 'booking-rejected') {
      await emailService.sendBookingRejectedEmail(bookingId);
      console.log(`📧 [REJECTION] Email sent for booking ${bookingId}`)
    }

    if (job.name === 'booking-no-show') {
      await emailService.sendNoShowNotificationEmail(bookingId);
      console.log(`📧 [NO_SHOW] Email sent for booking ${bookingId}`)
    }
  },
  {
    connection,
    concurrency: 1 // one email at a time (safe for SMTP)
  }
);
worker.on('completed', job => {
  console.log(`✅ Email sent for booking ${job.data.bookingId}`);
});

worker.on('failed', (job, err) => {
  console.error(
    `❌ Email failed for booking ${job?.data?.bookingId}:`,
    err.message
  );
});