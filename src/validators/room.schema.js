// validations/room.schema.js
import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z
    .string({
      required_error: 'name is required',
      invalid_type_error: 'name must be a string'
    })
    .trim()
    .nonempty('Title cannot be empty')
    .min(2, 'name must be at least 2 characters')
    .max(100, 'name must be at most 100 characters'),

  type: z.enum(['standard', 'boardroom', 'regular']).default('standard'),

  capacity: z
    .number({
      required_error: 'capacity is required'
    })
    .int()
    .min(1, 'capacity must be greater than 0'),

  creditsPerHour: z
    .number()
    .int()
    .min(0, 'creditsPerHour must be >= 0'),
});
