import Redis from 'ioredis';

class MockRedis {
  private store = new Map<string, string>();
  private ttls = new Map<string, number>();

  constructor() {
    console.warn('⚠️ Redis connection failed or not configured. Falling back to Mock In-Memory Store.');
  }

  async get(key: string): Promise<string | null> {
    this.checkTTL(key);
    return this.store.get(key) || null;
  }

  async set(key: string, value: string, ...args: any[]): Promise<'OK'> {
    this.store.set(key, value);
    
    // Parse EX (expire in seconds)
    const exIdx = args.indexOf('EX');
    if (exIdx !== -1 && typeof args[exIdx + 1] === 'number') {
      const ttlSeconds = args[exIdx + 1];
      this.ttls.set(key, Date.now() + ttlSeconds * 1000);
    }
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    this.ttls.delete(key);
    return existed ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    this.checkTTL(key);
    const val = this.store.get(key);
    const num = val ? parseInt(val, 10) : 0;
    const newVal = num + 1;
    this.store.set(key, newVal.toString());
    return newVal;
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (this.store.has(key)) {
      this.ttls.set(key, Date.now() + seconds * 1000);
      return 1;
    }
    return 0;
  }

  private checkTTL(key: string) {
    const expireAt = this.ttls.get(key);
    if (expireAt && Date.now() > expireAt) {
      this.store.delete(key);
      this.ttls.delete(key);
    }
  }
}

class RedisClientWrapper {
  private client: any;
  public isMock = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        showFriendlyErrorStack: true,
        connectTimeout: 1000,
        lazyConnect: true,
      });

      this.client.on('error', () => {
        this.switchToMock();
      });
    } catch (e) {
      this.switchToMock();
    }
  }

  private switchToMock() {
    if (!this.isMock) {
      this.isMock = true;
      this.client = new MockRedis();
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (this.isMock) return this.client.get(key);
      return await this.client.get(key);
    } catch (err) {
      this.switchToMock();
      return this.client.get(key);
    }
  }

  async set(key: string, value: string, ...args: any[]): Promise<'OK'> {
    try {
      if (this.isMock) return this.client.set(key, value, ...args);
      return await this.client.set(key, value, ...args);
    } catch (err) {
      this.switchToMock();
      return this.client.set(key, value, ...args);
    }
  }

  async del(key: string): Promise<number> {
    try {
      if (this.isMock) return this.client.del(key);
      return await this.client.del(key);
    } catch (err) {
      this.switchToMock();
      return this.client.del(key);
    }
  }

  async incr(key: string): Promise<number> {
    try {
      if (this.isMock) return this.client.incr(key);
      return await this.client.incr(key);
    } catch (err) {
      this.switchToMock();
      return this.client.incr(key);
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    try {
      if (this.isMock) return this.client.expire(key, seconds);
      return await this.client.expire(key, seconds);
    } catch (err) {
      this.switchToMock();
      return this.client.expire(key, seconds);
    }
  }

  // Method to allow calling arbitrary raw commands (needed for rate-limit-redis compatibility)
  async call(command: string, ...args: string[]): Promise<any> {
    try {
      if (this.isMock) {
        const cmd = command.toLowerCase();
        if (cmd === 'get') return this.client.get(args[0]);
        if (cmd === 'set') return this.client.set(args[0], args[1], ...args.slice(2));
        if (cmd === 'del') return this.client.del(args[0]);
        if (cmd === 'incr') return this.client.incr(args[0]);
        if (cmd === 'expire') return this.client.expire(args[0], parseInt(args[1], 10));
        return null;
      }
      return await this.client.call(command, ...args);
    } catch (err) {
      this.switchToMock();
      return this.call(command, ...args);
    }
  }
}

const redisClient = new RedisClientWrapper();
export default redisClient;
