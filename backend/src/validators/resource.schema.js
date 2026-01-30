import { z } from 'zod';

export const createResourceSchema = z.object({
  name: z
    .string({ required_error: 'Resource name is required' })
    .trim()
    .min(1, 'Resource name cannot be empty')
    .max(100, 'Resource name must be at most 100 characters')
    .refine(val => val !== '""', 'Resource name cannot be empty quotes'),

  type: z.enum(['DEVICE']).default('DEVICE'),

  quantity: z
    .coerce.number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1'),

  creditsPerHour: z
    .coerce.number()
    .int('Credits per hour must be an integer')
    .min(1, 'Credits per hour must be at least 1'),

  isActive: z.boolean().default(true)
});

export const updateResourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Resource name must be at least 2 characters')
    .max(100, 'Resource name must be at most 100 characters')
    .refine(val => val.replace(/["\s]/g, '').length > 0, 'Resource name cannot be empty or just quotes')
    .optional(),

  quantity: z
    .coerce.number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be >= 1')
    .optional(),

  creditsPerHour: z
    .coerce.number()
    .int('Credits per hour must be an integer')
    .min(0, 'Credits must be >= 0')
    .optional(),

  isActive: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
});