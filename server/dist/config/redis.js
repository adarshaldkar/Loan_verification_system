"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
class MockRedis {
    store = new Map();
    ttls = new Map();
    constructor() {
        console.warn('⚠️ Redis connection failed or not configured. Falling back to Mock In-Memory Store.');
    }
    async get(key) {
        this.checkTTL(key);
        return this.store.get(key) || null;
    }
    async set(key, value, ...args) {
        this.store.set(key, value);
        // Parse EX (expire in seconds)
        const exIdx = args.indexOf('EX');
        if (exIdx !== -1 && typeof args[exIdx + 1] === 'number') {
            const ttlSeconds = args[exIdx + 1];
            this.ttls.set(key, Date.now() + ttlSeconds * 1000);
        }
        return 'OK';
    }
    async del(key) {
        const existed = this.store.has(key);
        this.store.delete(key);
        this.ttls.delete(key);
        return existed ? 1 : 0;
    }
    async incr(key) {
        this.checkTTL(key);
        const val = this.store.get(key);
        const num = val ? parseInt(val, 10) : 0;
        const newVal = num + 1;
        this.store.set(key, newVal.toString());
        return newVal;
    }
    async expire(key, seconds) {
        if (this.store.has(key)) {
            this.ttls.set(key, Date.now() + seconds * 1000);
            return 1;
        }
        return 0;
    }
    // Support rate-limit-redis command patterns
    async call(command, ...args) {
        const cmd = command.toLowerCase();
        if (cmd === 'script' && args[0]?.toLowerCase() === 'exists') {
            return [0]; // script doesn't exist yet
        }
        if (cmd === 'script' && args[0]?.toLowerCase() === 'load') {
            return 'mock-rate-limit-sha'; // mock script SHA
        }
        if (cmd === 'evalsha' || cmd === 'eval') {
            // rate-limit-redis script expects a response array: [currentHits, resetTimeMs]
            const key = args[2] || 'rate-limit-key';
            const limit = 1000;
            const windowMs = 15 * 60 * 1000;
            const count = await this.incr(key);
            if (count === 1) {
                await this.expire(key, windowMs / 1000);
            }
            return [count, Date.now() + windowMs];
        }
        if (cmd === 'get')
            return this.get(args[0]);
        if (cmd === 'set')
            return this.set(args[0], args[1], ...args.slice(2));
        if (cmd === 'del')
            return this.del(args[0]);
        if (cmd === 'incr')
            return this.incr(args[0]);
        if (cmd === 'expire')
            return this.expire(args[0], parseInt(args[1], 10));
        return null;
    }
    checkTTL(key) {
        const expireAt = this.ttls.get(key);
        if (expireAt && Date.now() > expireAt) {
            this.store.delete(key);
            this.ttls.delete(key);
        }
    }
}
class RedisClientWrapper {
    client;
    isMock = false;
    constructor() {
        const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
        try {
            this.client = new ioredis_1.default(redisUrl, {
                maxRetriesPerRequest: 1,
                showFriendlyErrorStack: true,
                connectTimeout: 1000,
                lazyConnect: true,
            });
            this.client.on('error', () => {
                this.switchToMock();
            });
        }
        catch (e) {
            this.switchToMock();
        }
    }
    switchToMock() {
        if (!this.isMock) {
            this.isMock = true;
            this.client = new MockRedis();
        }
    }
    async get(key) {
        try {
            if (this.isMock)
                return this.client.get(key);
            return await this.client.get(key);
        }
        catch (err) {
            this.switchToMock();
            return this.client.get(key);
        }
    }
    async set(key, value, ...args) {
        try {
            if (this.isMock)
                return this.client.set(key, value, ...args);
            return await this.client.set(key, value, ...args);
        }
        catch (err) {
            this.switchToMock();
            return this.client.set(key, value, ...args);
        }
    }
    async del(key) {
        try {
            if (this.isMock)
                return this.client.del(key);
            return await this.client.del(key);
        }
        catch (err) {
            this.switchToMock();
            return this.client.del(key);
        }
    }
    async incr(key) {
        try {
            if (this.isMock)
                return this.client.incr(key);
            return await this.client.incr(key);
        }
        catch (err) {
            this.switchToMock();
            return this.client.incr(key);
        }
    }
    async expire(key, seconds) {
        try {
            if (this.isMock)
                return this.client.expire(key, seconds);
            return await this.client.expire(key, seconds);
        }
        catch (err) {
            this.switchToMock();
            return this.client.expire(key, seconds);
        }
    }
    async call(command, ...args) {
        try {
            if (this.isMock) {
                return this.client.call(command, ...args);
            }
            return await this.client.call(command, ...args);
        }
        catch (err) {
            this.switchToMock();
            return this.client.call(command, ...args);
        }
    }
}
const redisClient = new RedisClientWrapper();
exports.default = redisClient;
