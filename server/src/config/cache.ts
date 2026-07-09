export class LocalTTLCache {
  private cache = new Map<string, { value: any; expiry: number }>();

  constructor(private defaultTTLMs: number = 300000) {} // Default TTL: 5 minutes (300,000 ms)

  /**
   * Store a value in the cache with a Time-To-Live (TTL).
   */
  set(key: string, value: any, ttlMs?: number): void {
    const expiry = Date.now() + (ttlMs ?? this.defaultTTLMs);
    this.cache.set(key, { value, expiry });
  }

  /**
   * Retrieve a value from the cache. Returns null if expired or not found.
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key); // Evict expired entry
      return null;
    }
    return cached.value as T;
  }

  /**
   * Manually invalidate a key.
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all items in cache.
   */
  clear(): void {
    this.cache.clear();
  }
}

export const localCache = new LocalTTLCache();
