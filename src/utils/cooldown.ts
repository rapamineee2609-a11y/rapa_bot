import { CacheManager } from '../core/cache.js';

export class Cooldown {
  private static instance: Cooldown;
  private cache: CacheManager;

  private constructor() {
    this.cache = CacheManager.getInstance();
  }

  public static getInstance(): Cooldown {
    if (!Cooldown.instance) {
      Cooldown.instance = new Cooldown();
    }
    return Cooldown.instance;
  }

  public check(key: string, seconds: number): boolean {
    const data = this.cache.get<{ count: number; first: number }>(key);
    const now = Date.now();

    if (!data) {
      this.cache.set(key, { count: 1, first: now }, seconds);
      return true;
    }

    const elapsed = (now - data.first) / 1000;
    if (elapsed >= seconds) {
      this.cache.set(key, { count: 1, first: now }, seconds);
      return true;
    }

    data.count += 1;
    this.cache.set(key, data, Math.ceil(seconds - elapsed));
    return false;
  }

  public getRemaining(key: string): number {
    const data = this.cache.get<{ count: number; first: number }>(key);
    if (!data) return 0;
    const elapsed = (Date.now() - data.first) / 1000;
    const ttl = this.cache['cache'].getTtl(key);
    if (ttl) {
      return Math.ceil((ttl - Date.now()) / 1000);
    }
    return 0;
  }

  public clear(key: string): void {
    this.cache.del(key);
  }
}
