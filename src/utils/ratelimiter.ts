import { CacheManager } from '../core/cache.js';

export class RateLimiter {
  private static instance: RateLimiter;
  private cache: CacheManager;

  private constructor() {
    this.cache = CacheManager.getInstance();
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  public check(key: string, max: number, windowSeconds: number): boolean {
    const data = this.cache.get<{ count: number; reset: number }>(key);
    const now = Date.now();

    if (!data || now > data.reset) {
      this.cache.set(key, { count: 1, reset: now + windowSeconds * 1000 }, windowSeconds);
      return true;
    }

    if (data.count < max) {
      data.count += 1;
      const remaining = Math.ceil((data.reset - now) / 1000);
      this.cache.set(key, data, remaining);
      return true;
    }

    return false;
  }

  public getRemaining(key: string): number {
    const data = this.cache.get<{ count: number; reset: number }>(key);
    if (!data) return 0;
    const remaining = Math.ceil((data.reset - Date.now()) / 1000);
    return Math.max(0, remaining);
  }

  public reset(key: string): void {
    this.cache.del(key);
  }
}
