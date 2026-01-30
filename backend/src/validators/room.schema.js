import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z
    .string({ required_error: 'Room name is required' })
    .trim()
    .min(2, 'Room name must be at least 2 characters')
    .max(100, 'Room name must be at most 100 characters')
    .refine(val => val.replace(/["\s]/g, '').length > 0, 'Room name cannot be empty or just quotes'),

  type: z.enum(['standard', 'boardroom', 'training']).default('standard'),

  capacity: z
    .coerce.number()
    .int('Capacity must be an integer')
    .min(1, 'Capacity must be greater than 0'),

  creditsPerHour: z
    .coerce.number()
    .int('Credits per hour must be an integer')
    .min(0, 'Credits per hour must be >= 0'),

  isActive: z.boolean().default(true)
});


export const updateRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Room name must be at least 2 characters')
    .max(100, 'Room name must be at most 100 characters')
    .refine(val => val.replace(/["\s]/g, '').length > 0, 'Room name cannot be empty or just quotes')
    .optional(),

  type: z.enum(['standard', 'boardroom']).optional(),

  capacity: z
    .coerce.number()
    .int('Capacity must be an integer')
    .min(1, 'Capacity must be greater than 0')
    .optional(),

  creditsPerHour: z
    .coerce.number()
    .int('Credits per hour must be an integer')
    .min(0, 'Credits per hour must be >= 0')
    .optional(),

  location: z.string().optional().nullable(),

  amenities: z.object({
    whiteboard: z.boolean().optional(),
    screen: z.boolean().optional(),
    videoConferencing: z.boolean().optional()
  }).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
});