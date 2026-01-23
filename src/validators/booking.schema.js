import { z } from 'zod';

export const bookingSchema = z.object({
  // uid: z.string().min(1, { message: 'UID is required' }),

  title: z
    .string({
      required_error: 'Title is required',
      invalid_type_error: 'Title must be a string'
    })
    .trim()
    .nonempty('Title cannot be empty')
    .min(2, 'Title must be at least 2 characters')
    .max(255, 'Title cannot exceed 255 characters'),

  // startTime: z
  //   .string()
  //   .or(z.date())
  //   .refine(
  //     (val) => !isNaN(new Date(val).getTime()),
  //     { message: 'Invalid start time' }
  //   ),

  // endTime: z
  //   .string()
  //   .or(z.date())
  //   .refine(
  //     (val) => !isNaN(new Date(val).getTime()),
  //     { message: 'Invalid end time' }
  //   ),

//   status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'NO_SHOW']).default('CONFIRMED'),

//   roomId: z.number().int().positive().optional().nullable(),

//   userId: z.number().int().positive({ message: 'User ID must be a positive integer' }),

//   departmentId: z.number().int().positive().optional().nullable(),

//   creditsUsed: z.number().int().nonnegative().default(0),

//   approvedBy: z.number().int().positive().optional().nullable(),

//   approvedAt: z
//     .string()
//     .or(z.date())
//     .optional()
//     .nullable()
//     .refine(
//       (val) => !val || !isNaN(new Date(val).getTime()),
//       { message: 'Invalid approvedAt date' }
//     ),

//   isRecurring: z.boolean().default(false),

//   recurringGroup: z.string().optional().nullable(),

//   checkedIn: z.boolean().default(false),
//   checkedOut: z.boolean().default(false)
// })
// .superRefine((data, ctx) => {
//   // Ensure endTime > startTime
//   if (data.startTime && data.endTime) {
//     const start = new Date(data.startTime);
//     const end = new Date(data.endTime);
//     if (end <= start) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['endTime'],
//         message: 'endTime must be after startTime'
//       });
//     }
//   }

  // Ensure recurringGroup is provided if isRecurring is true
  // if (data.isRecurring && !data.recurringGroup) {
  //   ctx.addIssue({
  //     code: z.ZodIssueCode.custom,
  //     path: ['recurringGroup'],
  //     message: 'recurringGroup is required for recurring bookings'
  //   });
  // }
});
