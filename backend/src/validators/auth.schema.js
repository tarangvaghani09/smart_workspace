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
    .min(1, 'Email is required')
    .pipe(z.email('Email is not valid'))
    .transform(v => v.toLowerCase()),

  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain one uppercase letter')
    .regex(/[a-z]/, 'Password must contain one lowercase letter')
    .regex(/[0-9]/, 'Password must contain one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain one special character'),

  departmentId: z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return undefined;
      const n = Number(v);
      return Number.isInteger(n) ? n : v;
    },
    z.number({ required_error: 'DepartmentId is required' })
      .int()
      .positive('DepartmentId must be a positive integer')
  )
});


export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .pipe(z.email('Email is not valid'))
    .transform(v => v.toLowerCase()),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty')
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Current password is required' })
    .min(1, 'Current password cannot be empty'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain one uppercase letter')
    .regex(/[a-z]/, 'Password must contain one lowercase letter')
    .regex(/[0-9]/, 'Password must contain one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain one special character'),
  confirmNewPassword: z
    .string({ required_error: 'Confirm new password is required' })
    .min(1, 'Confirm new password cannot be empty')
}).superRefine((data, ctx) => {
  if (data.newPassword !== data.confirmNewPassword) {
    ctx.addIssue({
      code: 'custom',
      path: ['confirmNewPassword'],
      message: 'Confirm password does not match new password'
    });
  }

  if (data.currentPassword === data.newPassword) {
    ctx.addIssue({
      code: 'custom',
      path: ['newPassword'],
      message: 'New password must be different from current password'
    });
  }
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .pipe(z.email('Email is not valid'))
    .transform(v => v.toLowerCase())
});

export const resetPasswordSchema = z.object({
  token: z
    .string({ required_error: 'Token is required' })
    .min(20, 'Invalid token'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain one uppercase letter')
    .regex(/[a-z]/, 'Password must contain one lowercase letter')
    .regex(/[0-9]/, 'Password must contain one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain one special character'),
  confirmNewPassword: z
    .string({ required_error: 'Confirm new password is required' })
    .min(1, 'Confirm new password cannot be empty')
}).superRefine((data, ctx) => {
  if (data.newPassword !== data.confirmNewPassword) {
    ctx.addIssue({
      code: 'custom',
      path: ['confirmNewPassword'],
      message: 'Confirm password does not match new password'
    });
  }
});
