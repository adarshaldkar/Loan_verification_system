"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localCache = exports.LocalTTLCache = void 0;
class LocalTTLCache {
    defaultTTLMs;
    cache = new Map();
    constructor(defaultTTLMs = 300000) {
        this.defaultTTLMs = defaultTTLMs;
    } // Default TTL: 5 minutes (300,000 ms)
    /**
     * Store a value in the cache with a Time-To-Live (TTL).
     */
    set(key, value, ttlMs) {
        const expiry = Date.now() + (ttlMs ?? this.defaultTTLMs);
        this.cache.set(key, { value, expiry });
    }
    /**
     * Retrieve a value from the cache. Returns null if expired or not found.
     */
    get(key) {
        const cached = this.cache.get(key);
        if (!cached)
            return null;
        if (Date.now() > cached.expiry) {
            this.cache.delete(key); // Evict expired entry
            return null;
        }
        return cached.value;
    }
    /**
     * Manually invalidate a key.
     */
    delete(key) {
        this.cache.delete(key);
    }
    /**
     * Clear all items in cache.
     */
    clear() {
        this.cache.clear();
    }
}
exports.LocalTTLCache = LocalTTLCache;
exports.localCache = new LocalTTLCache();
