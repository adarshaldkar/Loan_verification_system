"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPasswordLimiter = exports.trackSecurityFailures = exports.ipBlacklistHandler = exports.pingLimiter = exports.authLimiter = exports.globalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = __importDefault(require("rate-limit-redis"));
const redis_1 = __importDefault(require("../config/redis"));
const createLimiterStore = () => new rate_limit_redis_1.default({
    sendCommand: async (...args) => {
        return redis_1.default.call(args[0], ...args.slice(1));
    },
});
const isDev = process.env.NODE_ENV !== 'production';
// 1. Global Rate Limiter
// Dev: 100,000 req / 15 min (effectively disabled)
// Prod: 1,000 req / 15 min
exports.globalLimiter = (0, express_rate_limit_1.default)({
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
exports.authLimiter = (0, express_rate_limit_1.default)({
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
exports.pingLimiter = (0, express_rate_limit_1.default)({
    windowMs: 3 * 1000,
    max: isDev ? 1_000 : 1,
    store: createLimiterStore(),
    keyGenerator: (req) => {
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
const ipBlacklistHandler = async (req, res, next) => {
    const ip = req.ip;
    try {
        const isBlocked = await redis_1.default.get(`blocked:ip:${ip}`);
        if (isBlocked) {
            return res.status(403).json({
                success: false,
                message: 'Access temporarily restricted due to suspicious activity. Please try again in 1 hour.',
            });
        }
    }
    catch (err) {
        // Fail-safe: proceed if Redis is down
    }
    next();
};
exports.ipBlacklistHandler = ipBlacklistHandler;
// 5. Track Security Failures (401/403/404) to trigger IP Blacklist
// Only active in production to avoid self-blacklisting during dev/testing
const trackSecurityFailures = (req, res, next) => {
    // Skip tracking in development mode
    if (process.env.NODE_ENV !== 'production') {
        return next();
    }
    const ip = req.ip;
    res.on('finish', async () => {
        if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 404) {
            try {
                const failKey = `fail:ip:${ip}`;
                const count = await redis_1.default.incr(failKey);
                if (count === 1) {
                    await redis_1.default.expire(failKey, 60); // 1-minute tracking window
                }
                if (count >= 50) {
                    // Block IP for 1 hour (3600 seconds)
                    await redis_1.default.set(`blocked:ip:${ip}`, '1', 'EX', 3600);
                    console.warn(`🚨 [DDoS/Brute-force protection]: IP ${ip} has been blacklisted for 1 hour after ${count} failed attempts.`);
                }
            }
            catch (err) {
                // Fail-safe
            }
        }
    });
    next();
};
exports.trackSecurityFailures = trackSecurityFailures;
// 6. Forgot Password Limiter (max 3 reset attempts per 15 minutes)
exports.forgotPasswordLimiter = (0, express_rate_limit_1.default)({
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
