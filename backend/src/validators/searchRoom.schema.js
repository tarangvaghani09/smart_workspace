import { z } from 'zod';

export const searchRoomsSchema = z.object({
  capacity: z.number({invalid_type_error: 'capacity must be a number'}).int().min(1).optional(),
  features: z.array(z.string()).optional(),
  date: z.string({ required_error: 'Date is required' }),
  startTime: z.string({ required_error: 'Start time is required' }),
  endTime: z.string({ required_error: 'End time is required' }),
  timezone: z.string({ required_error: 'Timezone is required' })
});