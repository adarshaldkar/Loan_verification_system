import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../config/redis';

// Determine if we should use RedisStore or fallback to in-memory store
const isRealRedis = redisClient.constructor.name === 'Redis';

const limiterStore = isRealRedis
  ? new RedisStore({
      sendCommand: async (...args: string[]) => {
        return redisClient.call(args[0], ...args.slice(1));
      },
    })
  : undefined;

// 1. Global Rate Limiter (1000 requests per 15 minutes)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  store: limiterStore,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Brute-Force Login Limiter (10 login attempts per 5 minutes)
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  store: limiterStore,
  message: {
    success: false,
    message: 'Too many login attempts. Access blocked for 5 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Location Ping Limiter (Max 1 location ping per 3 seconds per agent)
export const pingLimiter = rateLimit({
  windowMs: 3 * 1000,
  max: 1,
  store: limiterStore,
  keyGenerator: (req: any) => {
    // Rate-limit by agent ID if logged in, otherwise default to IP
    return req.user?.id || req.ip;
  },
  message: {
    success: false,
    message: 'Location pings are throttled to once every 3 seconds.',
  },
  standardHeaders: true,
  legacyHeaders: false,
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
  store: limiterStore,
  message: {
    success: false,
    message: 'Too many reset requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
