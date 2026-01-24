import rateLimit from 'express-rate-limit';

/**
 * GENERAL API LIMIT
 * For authenticated users
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per user/IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      error: 'TOO_MANY_REQUESTS'
    });
  }
});

/**
 * LOGIN LIMIT (ANTI BRUTE FORCE)
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // 15 login attempts
  message: {
    error: 'Too many login attempts. Try again after 15 minutes.'
  }
});

/**
 * ADMIN LIMIT
 * Slightly stricter
 */
export const adminLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 200,
  message: {
    error: 'Admin rate limit exceeded.'
  }
});