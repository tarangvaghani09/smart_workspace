import { Queue } from 'bullmq';
import connection from './redis.js';

export const emailQueue = new Queue('email-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,          // retry 3 times
    backoff: {
      type: 'exponential',
      delay: 5000         // retry after 5s
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});