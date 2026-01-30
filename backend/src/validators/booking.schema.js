import { z } from 'zod';

export const createBookingSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(255),

  roomId: z.number().int().positive().nullable().optional(),

  resources: z.array(
    z.object({
      resourceId: z.number().int().positive(),
      quantity: z.number().int().positive().default(1)
    })
  ).default([]),

  startTime: z.coerce.date(),
  endTime: z.coerce.date(),

  recurrenceType: z.enum(['ONE_TIME', 'WEEKLY']).default('ONE_TIME'),
  weeks: z.number().int().min(1).max(52).default(1)
})
  .refine(
    (data) => data.endTime > data.startTime,
    {
      message: 'End time must be after start time',
      path: ['endTime']
    }
  )
  .refine(
    (data) => data.roomId || data.resources.length > 0,
    {
      message: 'Booking must include a room or at least one resource'
    }
  );