// validations/resource.schema.js
import { z } from 'zod';

export const createResourceSchema = z.object({
  name: z
    .string({
      required_error: 'Resource name is required',
      invalid_type_error: 'Resource name must be a string'
    })
    .trim()
    .nonempty('name cannot be empty')
    .min(2, 'Resource name must be at least 2 characters')
    .max(100, 'Resource name must be at most 100 characters'),

  type: z.enum(['DEVICE']).default('DEVICE'),

  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number'
    })
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1'),

  creditsPerHour: z
    .number({
      required_error: 'Credits per hour is required',
      invalid_type_error: 'Credits per hour must be a number'
    })
    .int('Credits per hour must be an integer')
    .min(1, 'Credits per hour must be at least 1'),

  isActive: z.boolean().optional().default(true)
}
);