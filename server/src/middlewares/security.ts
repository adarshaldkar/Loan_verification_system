import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../config/redis';

const createLimiterStore = () => new RedisStore({
  sendCommand: async (...args: string[]) => {
    return redisClient.call(args[0], ...args.slice(1));
  },
});

const isDev = process.env.NODE_ENV !== 'production';

// 1. Global Rate Limiter
// Dev: 100,000 req / 15 min (effectively disabled)
// Prod: 1,000 req / 15 min
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100_000 : 1000,
  store: createLimiterStore(),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

// 2. Brute-Force Login Limiter
// Dev: 1,000 attempts / 5 min (effectively disabled)
// Prod: 10 attempts / 5 min
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isDev ? 1_000 : 10,
  store: createLimiterStore(),
  message: {
    success: false,
    message: 'Too many login attempts. Access blocked for 5 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

// 3. Location Ping Limiter
// Dev: 1,000 pings / 3 sec (effectively disabled)
// Prod: 1 ping / 3 sec
export const pingLimiter = rateLimit({
  windowMs: 3 * 1000,
  max: isDev ? 1_000 : 1,
  store: createLimiterStore(),
  keyGenerator: (req: any) => {
    return req.user?.id || req.ip;
  },
  message: {
    success: false,
    message: 'Location pings are throttled to once every 3 seconds.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

// 4. IP Blacklisting & DDoS Protection Middleware
export const ipBlacklistHandler = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip;
  try {
    const isBlocked = await redisClient.get(`blocked:ip:${ip}`);
    if (isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Access temporarily restricted due to suspicious activity. Please try again in 1 hour.',
      });
    }
  } catch (err) {
    // Fail-safe: proceed if Redis is down
  }
  next();
};

// 5. Track Security Failures (401/403/404) to trigger IP Blacklist
export const trackSecurityFailures = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip;

  res.on('finish', async () => {
    if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 404) {
      try {
        const failKey = `fail:ip:${ip}`;
        const count = await redisClient.incr(failKey);
        if (count === 1) {
          await redisClient.expire(failKey, 60); // 1-minute tracking window
        }
        if (count >= 50) {
          // Block IP for 1 hour (3600 seconds)
          await redisClient.set(`blocked:ip:${ip}`, '1', 'EX', 3600);
          console.warn(`🚨 [DDoS/Brute-force protection]: IP ${ip} has been blacklisted for 1 hour after ${count} failed attempts.`);
        }
      } catch (err) {
        // Fail-safe
      }
    }
  });

  next();
};

// 6. Forgot Password Limiter (max 3 reset attempts per 15 minutes)
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  store: createLimiterStore(),
  message: {
    success: false,
    message: 'Too many reset requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
