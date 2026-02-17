import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

const getClientIp = (req) => req.ip || req.socket?.remoteAddress || 'unknown-ip';

const getUserIdFromRequest = (req) => {
  if (req.user?.id) return String(req.user.id);

  const authHeader = req.headers?.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload?.id ? String(payload.id) : null;
  } catch {
    return null;
  }
};

const userIpKeyGenerator = (req) => {
  const ip = getClientIp(req);
  const userId = getUserIdFromRequest(req);

  return userId ? `${userId}:${ip}` : ip;
};

// GENERAL API LIMIT For authenticated users

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per user/IP
  keyGenerator: userIpKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfter = Math.ceil(15 * 60);

    res.set('Retry-After', retryAfter);
    return res.status(429).json({
      error: 'TOO_MANY_REQUESTS',
      retryAfterMinutes: 15
    });
  }
});

// LOGIN LIMIT

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // 15 login attempts
  keyGenerator: getClientIp,
  message: {
    error: 'Too many login attempts. Try again after 15 minutes.',
    retryAfterMinutes: 15
  }
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyGenerator: getClientIp,
  message: {
    error: 'Too many reset requests. Try again after 15 minutes.',
    retryAfterMinutes: 15
  }
});

//  ADMIN LIMIT

export const adminLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 200,
  keyGenerator: userIpKeyGenerator,
  message: {
    error: 'Admin rate limit exceeded.'
  }
});
