import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .regex(/^[A-Za-z\s.'-]+$/, 'Name contains invalid characters'),

  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Email is not valid')
    .transform(v => v.toLowerCase()),

  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain one uppercase letter')
    .regex(/[a-z]/, 'Password must contain one lowercase letter')
    .regex(/[0-9]/, 'Password must contain one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain one special character'),

  department: z
    .string({ required_error: 'Department is required' })
    .trim()
    .min(1, 'Department cannot be empty')
});


export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Email is not valid')
    .transform(v => v.toLowerCase()),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty')
});
