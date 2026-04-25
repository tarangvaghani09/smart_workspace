import emailService from '../services/emailService.js';

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_BACKOFF_MS = 5000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const handlers = {
  'booking-confirmed': async (payload) => {
    await emailService.sendBookingConfirmationEmail(payload?.bookingId);
  },
  'booking-rejected': async (payload) => {
    await emailService.sendBookingRejectedEmail(payload?.bookingId);
  },
  'booking-expired': async (payload) => {
    await emailService.sendBookingExpiredEmail(payload?.bookingId);
  },
  'booking-no-show': async (payload) => {
    await emailService.sendNoShowNotificationEmail(payload?.bookingId);
  },
  'password-reset': async (payload) => {
    await emailService.sendPasswordResetEmail(payload || {});
  }
};

const runWithRetry = async (jobName, payload) => {
  const handler = handlers[jobName];
  if (!handler) {
    throw new Error(`Unknown email job: ${jobName}`);
  }

  let lastError = null;
  for (let attempt = 1; attempt <= DEFAULT_ATTEMPTS; attempt += 1) {
    try {
      await handler(payload);
      return;
    } catch (err) {
      lastError = err;
      console.error(
        `Email job failed (${jobName}) attempt ${attempt}/${DEFAULT_ATTEMPTS}:`,
        err?.code ? `${err.code}: ${err.message || err}` : (err?.message || err)
      );

      if (attempt < DEFAULT_ATTEMPTS) {
        await sleep(DEFAULT_BACKOFF_MS);
      }
    }
  }

  throw lastError;
};

export const emailQueue = {
  add: async (jobName, payload) => {
    setImmediate(() => {
      runWithRetry(jobName, payload).catch((err) => {
        console.error(`Email job permanently failed (${jobName}):`, err?.message || err);
      });
    });

    return { name: jobName };
  }
};
