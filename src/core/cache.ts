import NodeCache from 'node-cache';
import { Logger } from './logger.js';

export class CacheManager {
  private static instance: CacheManager;
  private cache: NodeCache;
  private logger: Logger;

  private constructor() {
    this.logger = Logger.getInstance();
    this.cache = new NodeCache({
      stdTTL: 600,
      checkperiod: 120,
      useClones: false,
      maxKeys: 1000,
    });

    this.cache.on('expired', (key, value) => {
      this.logger.debug(`⏳ Cache expired: ${key}`);
    });
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  public set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl);
  }

  public get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  public del(key: string): number {
    return this.cache.del(key);
  }

  public flush(): void {
    this.cache.flushAll();
    this.logger.info('🧹 Cache cleared');
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  public getStats(): { keys: number; hits: number; misses: number } {
    return this.cache.getStats();
  }

  public getKeys(): string[] {
    return this.cache.keys();
  }

  public mget<T>(keys: string[]): Record<string, T> {
    return this.cache.mget<T>(keys);
  }

  public mset<T>(keyValuePairs: { key: string; val: T; ttl?: number }[]): boolean {
    return this.cache.mset(keyValuePairs);
  }
}
