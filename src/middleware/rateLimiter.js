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
        const retryAfter = Math.ceil(15 * 60); // seconds

    res.set('Retry-After', retryAfter);
    return res.status(429).json({
      error: 'TOO_MANY_REQUESTS',
       retryAfterMinutes: 15
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
    error: 'Too many login attempts. Try again after 15 minutes.',
     retryAfterMinutes: 15
  }
});

/**
 * ADMIN LIMIT
 * Slightly stricter
 */
export const adminLimiter = rateLimit({
  //user ip finder
  
  windowMs: 10 * 60 * 1000,
  max: 200,
  message: {
    error: 'Admin rate limit exceeded.'
  }
});