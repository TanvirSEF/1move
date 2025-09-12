// File: lib/cache-manager.ts
// Advanced caching and data persistence for Circle.so integration

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  source: 'api' | 'manual' | 'fallback';
  version: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxAge?: number; // Maximum age before considering stale
  source?: 'api' | 'manual' | 'fallback';
}

export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly VERSION = '1.0.0';
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_AGE = 30 * 60 * 1000; // 30 minutes

  private constructor() {
    // Load cache from localStorage on initialization (client-side only)
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Set data in cache
  public set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const now = Date.now();
    const ttl = options.ttl || this.DEFAULT_TTL;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      source: options.source || 'api',
      version: this.VERSION
    };

    this.cache.set(key, entry);
    this.saveToStorage();
    
    console.log(`📦 Cache: Stored ${key} (source: ${entry.source}, ttl: ${ttl}ms)`);
  }

  // Get data from cache
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      console.log(`📦 Cache: Miss for ${key}`);
      return null;
    }

    const now = Date.now();
    
    // Check if expired
    if (now > entry.expiresAt) {
      console.log(`📦 Cache: Expired ${key} (age: ${now - entry.timestamp}ms)`);
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    console.log(`📦 Cache: Hit for ${key} (age: ${now - entry.timestamp}ms, source: ${entry.source})`);
    return entry.data;
  }

  // Get data with metadata
  public getWithMeta<T>(key: string): { data: T; meta: Omit<CacheEntry<T>, 'data'> } | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Return even if expired, but mark it in metadata
    const { data, ...meta } = entry;
    return {
      data,
      meta: {
        ...meta,
        isExpired: now > entry.expiresAt,
        age: now - entry.timestamp
      } as any
    };
  }

  // Check if data exists and is fresh
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    return now <= entry.expiresAt;
  }

  // Check if data exists (even if expired)
  public exists(key: string): boolean {
    return this.cache.has(key);
  }

  // Get stale data (expired but still in cache)
  public getStale<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now <= entry.expiresAt) {
      // Data is still fresh, return normally
      return entry.data;
    }

    // Data is stale but exists
    const age = now - entry.timestamp;
    const maxAge = this.MAX_AGE;
    
    if (age > maxAge) {
      // Too old, remove it
      console.log(`📦 Cache: Removing stale ${key} (age: ${age}ms > max: ${maxAge}ms)`);
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    console.log(`📦 Cache: Returning stale ${key} (age: ${age}ms)`);
    return entry.data;
  }

  // Clear specific key
  public clear(key: string): void {
    this.cache.delete(key);
    this.saveToStorage();
    console.log(`📦 Cache: Cleared ${key}`);
  }

  // Clear all cache
  public clearAll(): void {
    this.cache.clear();
    this.saveToStorage();
    console.log('📦 Cache: Cleared all entries');
  }

  // Get cache statistics
  public getStats(): {
    totalEntries: number;
    freshEntries: number;
    staleEntries: number;
    expiredEntries: number;
    totalSize: number;
    entries: Array<{
      key: string;
      source: string;
      age: number;
      isExpired: boolean;
      size: number;
    }>;
  } {
    const now = Date.now();
    const entries: any[] = [];
    let freshCount = 0;
    let staleCount = 0;
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      const isExpired = now > entry.expiresAt;
      const isStale = isExpired && age <= this.MAX_AGE;
      const size = JSON.stringify(entry.data).length;

      entries.push({
        key,
        source: entry.source,
        age,
        isExpired,
        size
      });

      if (!isExpired) {
        freshCount++;
      } else if (isStale) {
        staleCount++;
      } else {
        expiredCount++;
      }
    }

    return {
      totalEntries: this.cache.size,
      freshEntries: freshCount,
      staleEntries: staleCount,
      expiredEntries: expiredCount,
      totalSize: entries.reduce((sum, entry) => sum + entry.size, 0),
      entries
    };
  }

  // Save cache to localStorage (client-side only)
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem('circle-cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('📦 Cache: Failed to save to localStorage:', error);
    }
  }

  // Load cache from localStorage (client-side only)
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('circle-cache');
      if (stored) {
        const cacheData = JSON.parse(stored);
        this.cache = new Map(cacheData);
        
        // Clean up expired entries
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [key, entry] of this.cache.entries()) {
          const age = now - entry.timestamp;
          if (age > this.MAX_AGE) {
            this.cache.delete(key);
            cleanedCount++;
          }
        }
        
        if (cleanedCount > 0) {
          console.log(`📦 Cache: Cleaned ${cleanedCount} expired entries on load`);
          this.saveToStorage();
        }
        
        console.log(`📦 Cache: Loaded ${this.cache.size} entries from storage`);
      }
    } catch (error) {
      console.warn('📦 Cache: Failed to load from localStorage:', error);
      this.cache.clear();
    }
  }
}

// Specialized cache keys for Circle.so data
export const CACHE_KEYS = {
  MEMBERS: 'circle-members',
  STATS: 'circle-stats',
  BROKERS: 'circle-brokers',
  CONNECTION_TEST: 'circle-connection-test',
  MANUAL_DATA: 'circle-manual-data'
} as const;

// Cache utility functions
export const cacheUtils = {
  // Get cached member data with fallback to manual data
  getMemberData: (): any => {
    const cache = CacheManager.getInstance();
    
    // Try to get fresh API data first
    let data = cache.get(CACHE_KEYS.MEMBERS);
    if (data) {
      return { data, source: 'api-cache', isFresh: true };
    }

    // Try to get stale API data
    data = cache.getStale(CACHE_KEYS.MEMBERS);
    if (data) {
      return { data, source: 'api-cache', isFresh: false };
    }

    // Try manual data as fallback
    data = cache.get(CACHE_KEYS.MANUAL_DATA);
    if (data) {
      return { data, source: 'manual', isFresh: true };
    }

    return null;
  },

  // Store member data with appropriate source
  storeMemberData: (data: any, source: 'api' | 'manual' = 'api'): void => {
    const cache = CacheManager.getInstance();
    const key = source === 'manual' ? CACHE_KEYS.MANUAL_DATA : CACHE_KEYS.MEMBERS;
    const ttl = source === 'manual' ? 24 * 60 * 60 * 1000 : 5 * 60 * 1000; // Manual data lasts 24h
    
    cache.set(key, data, { source, ttl });
  },

  // Get cache status for UI display
  getCacheStatus: () => {
    const cache = CacheManager.getInstance();
    const stats = cache.getStats();
    
    const membersMeta = cache.getWithMeta(CACHE_KEYS.MEMBERS);
    const manualMeta = cache.getWithMeta(CACHE_KEYS.MANUAL_DATA);
    
    return {
      hasApiData: !!membersMeta && !membersMeta.meta.isExpired,
      hasStaleApiData: !!membersMeta && membersMeta.meta.isExpired,
      hasManualData: !!manualMeta && !manualMeta.meta.isExpired,
      apiDataAge: membersMeta?.meta.age,
      manualDataAge: manualMeta?.meta.age,
      totalCacheSize: stats.totalSize,
      totalEntries: stats.totalEntries
    };
  },

  // Clear all Circle.so related cache
  clearCircleCache: (): void => {
    const cache = CacheManager.getInstance();
    Object.values(CACHE_KEYS).forEach(key => {
      cache.clear(key);
    });
  }
};

// Export singleton instance
export const cache = CacheManager.getInstance();
