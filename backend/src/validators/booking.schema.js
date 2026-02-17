import { z } from 'zod';

const dateTimeInputSchema = z.union([
  z.string().trim().min(1),
  z.date()
]);

const bookingResourceSchema = z.object({
  resourceId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive().default(1)
});

export const createBookingSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(255),

  roomId: z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return undefined;
      const n = Number(v);
      return Number.isInteger(n) ? n : v;
    },
    z.number().int().positive().optional()
  ),

  resources: z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === '') return [];
      return Array.isArray(v) ? v : [v];
    },
    z.array(bookingResourceSchema).default([])
  ),

  startTime: dateTimeInputSchema,
  endTime: dateTimeInputSchema,
  timezone: z.string().trim().optional().default('Asia/Kolkata'),

  recurrenceType: z.enum(['ONE_TIME', 'WEEKLY']).default('ONE_TIME'),
  weeks: z.coerce.number().int().min(1).max(52).default(1)
})
  .refine(
    (data) => data.roomId || data.resources.length > 0,
    {
      message: 'Booking must include a room or at least one resource'
    }
  );
