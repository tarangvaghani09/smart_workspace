import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Name must be a string'
    })
    .trim()
    .nonempty('Name cannot be empty')
    .min(2, 'Name must be at least 2 characters')
        .regex(
      /^[A-Za-z\s]+$/,
      'Name must contain only letters'
    ),

  email: z
    .string({
      required_error: 'Email is required'
    })
    .trim()
    .nonempty('Email cannot be empty')
    .email('Email is not valid')
    .transform(v => v.toLowerCase()),

  password: z
    .string({
      required_error: 'Password is required'
    })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain one uppercase letter')
    .regex(/[a-z]/, 'Password must contain one lowercase letter')
    .regex(/[0-9]/, 'Password must contain one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain one special character'),

  department: z
    .string({
      required_error: 'Department is required'
    })
    .trim()
  .nonempty('Department cannot be empty')
});


export const loginSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
      invalid_type_error: 'Email must be a string'
    })
    .trim()
    .nonempty('Email cannot be empty')
    .email('Email is not valid')
    .transform(v => v.toLowerCase()),

  password: z
    .string({
      required_error: 'Password is required',
      invalid_type_error: 'Password must be a string'
    })
    .nonempty('Password cannot be empty')
});
