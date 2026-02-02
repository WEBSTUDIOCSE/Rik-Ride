/**
 * Rate Limiter Service
 * Prevents excessive API calls to Google Maps and other external services
 */

interface RateLimitConfig {
  maxRequests: number;     // Maximum requests allowed
  windowMs: number;        // Time window in milliseconds
  minInterval: number;     // Minimum interval between requests in ms
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface RequestRecord {
  timestamps: number[];
  lastRequest: number;
}

/**
 * Rate Limiter with caching and request throttling
 */
class RateLimiter {
  private requestRecords: Map<string, RequestRecord> = new Map();
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxRequests: config.maxRequests ?? 100,      // 100 requests per window
      windowMs: config.windowMs ?? 60000,           // 1 minute window
      minInterval: config.minInterval ?? 200,       // 200ms between requests
    };
  }

  /**
   * Check if a request can proceed based on rate limits
   */
  canMakeRequest(key: string): { allowed: boolean; waitTime: number; reason?: string } {
    const now = Date.now();
    let record = this.requestRecords.get(key);

    if (!record) {
      record = { timestamps: [], lastRequest: 0 };
      this.requestRecords.set(key, record);
    }

    // Clean old timestamps outside the window
    const windowStart = now - this.config.windowMs;
    record.timestamps = record.timestamps.filter(ts => ts > windowStart);

    // Check max requests in window
    if (record.timestamps.length >= this.config.maxRequests) {
      const oldestInWindow = record.timestamps[0];
      const waitTime = oldestInWindow + this.config.windowMs - now;
      return {
        allowed: false,
        waitTime,
        reason: `Rate limit exceeded. Max ${this.config.maxRequests} requests per ${this.config.windowMs / 1000}s`
      };
    }

    // Check minimum interval
    const timeSinceLastRequest = now - record.lastRequest;
    if (timeSinceLastRequest < this.config.minInterval) {
      return {
        allowed: false,
        waitTime: this.config.minInterval - timeSinceLastRequest,
        reason: 'Too frequent. Please wait.'
      };
    }

    return { allowed: true, waitTime: 0 };
  }

  /**
   * Record a request
   */
  recordRequest(key: string): void {
    const now = Date.now();
    let record = this.requestRecords.get(key);

    if (!record) {
      record = { timestamps: [], lastRequest: 0 };
      this.requestRecords.set(key, record);
    }

    record.timestamps.push(now);
    record.lastRequest = now;
  }

  /**
   * Get cached data if valid
   */
  getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store data in cache
   */
  setCache<T>(key: string, data: T, ttlMs: number = 300000): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    });
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clear all caches and records
   */
  clear(): void {
    this.requestRecords.clear();
    this.cache.clear();
  }
}

/**
 * Specialized rate limiter for Google Maps API
 */
class GoogleMapsRateLimiter extends RateLimiter {
  private static instance: GoogleMapsRateLimiter | null = null;

  private constructor() {
    super({
      maxRequests: 50,      // 50 requests per minute
      windowMs: 60000,      // 1 minute window
      minInterval: 500,     // 500ms between requests (2 per second max)
    });
  }

  static getInstance(): GoogleMapsRateLimiter {
    if (!GoogleMapsRateLimiter.instance) {
      GoogleMapsRateLimiter.instance = new GoogleMapsRateLimiter();
    }
    return GoogleMapsRateLimiter.instance;
  }

  /**
   * Generate cache key for geocoding requests
   */
  static geocodeKey(address: string): string {
    return `geocode:${address.toLowerCase().trim()}`;
  }

  /**
   * Generate cache key for reverse geocoding requests
   */
  static reverseGeocodeKey(lat: number, lng: number, precision: number = 4): string {
    return `reverse:${lat.toFixed(precision)},${lng.toFixed(precision)}`;
  }

  /**
   * Generate cache key for directions requests
   */
  static directionsKey(origin: string, destination: string, mode: string = 'driving'): string {
    return `directions:${origin}|${destination}|${mode}`;
  }

  /**
   * Generate cache key for distance matrix requests
   */
  static distanceMatrixKey(origins: string[], destinations: string[]): string {
    return `matrix:${origins.join(',')}|${destinations.join(',')}`;
  }

  /**
   * Generate cache key for places search
   */
  static placesSearchKey(query: string, location?: { lat: number; lng: number }): string {
    const locationStr = location ? `@${location.lat},${location.lng}` : '';
    return `places:${query.toLowerCase()}${locationStr}`;
  }
}

/**
 * Debouncer for user input (e.g., autocomplete)
 */
class Debouncer {
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Debounce a function call
   */
  debounce<T>(
    key: string,
    fn: () => Promise<T>,
    delayMs: number = 300
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const existingTimeout = this.timeouts.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.timeouts.delete(key);
        }
      }, delayMs);

      this.timeouts.set(key, timeout);
    });
  }

  /**
   * Cancel a pending debounced call
   */
  cancel(key: string): void {
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }
  }

  /**
   * Cancel all pending calls
   */
  cancelAll(): void {
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
  }
}

/**
 * Throttler for continuous updates (e.g., live location)
 */
class Throttler {
  private lastExecutions: Map<string, number> = new Map();

  /**
   * Throttle a function call
   * @returns true if the function should execute, false if throttled
   */
  shouldExecute(key: string, intervalMs: number = 1000): boolean {
    const now = Date.now();
    const lastExecution = this.lastExecutions.get(key) ?? 0;

    if (now - lastExecution >= intervalMs) {
      this.lastExecutions.set(key, now);
      return true;
    }

    return false;
  }

  /**
   * Force reset the throttle for a key
   */
  reset(key: string): void {
    this.lastExecutions.delete(key);
  }

  /**
   * Clear all throttle records
   */
  clear(): void {
    this.lastExecutions.clear();
  }
}

/**
 * Location update batcher - batches location updates to reduce writes
 */
class LocationUpdateBatcher {
  private pendingUpdates: Map<string, { lat: number; lng: number; timestamp: number }> = new Map();
  private batchInterval: NodeJS.Timeout | null = null;
  private flushCallback: ((updates: Map<string, { lat: number; lng: number; timestamp: number }>) => Promise<void>) | null = null;

  constructor(private batchIntervalMs: number = 5000) {}

  /**
   * Start the batcher with a flush callback
   */
  start(flushCallback: (updates: Map<string, { lat: number; lng: number; timestamp: number }>) => Promise<void>): void {
    this.flushCallback = flushCallback;
    this.batchInterval = setInterval(() => this.flush(), this.batchIntervalMs);
  }

  /**
   * Stop the batcher
   */
  stop(): void {
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
      this.batchInterval = null;
    }
  }

  /**
   * Add a location update to the batch
   */
  addUpdate(driverId: string, lat: number, lng: number): void {
    this.pendingUpdates.set(driverId, {
      lat,
      lng,
      timestamp: Date.now(),
    });
  }

  /**
   * Flush pending updates
   */
  async flush(): Promise<void> {
    if (this.pendingUpdates.size === 0 || !this.flushCallback) return;

    const updates = new Map(this.pendingUpdates);
    this.pendingUpdates.clear();

    try {
      await this.flushCallback(updates);
    } catch (error) {
      console.error('Failed to flush location updates:', error);
      // Re-add failed updates
      for (const [id, location] of updates) {
        if (!this.pendingUpdates.has(id)) {
          this.pendingUpdates.set(id, location);
        }
      }
    }
  }

  /**
   * Get pending update count
   */
  getPendingCount(): number {
    return this.pendingUpdates.size;
  }
}

// Export singletons and classes
export const mapsRateLimiter = GoogleMapsRateLimiter.getInstance();
export const debouncer = new Debouncer();
export const throttler = new Throttler();
export { RateLimiter, GoogleMapsRateLimiter, Debouncer, Throttler, LocationUpdateBatcher };

/**
 * Helper function to make a rate-limited API call
 */
export async function rateLimitedCall<T>(
  key: string,
  apiCall: () => Promise<T>,
  options: {
    cacheKey?: string;
    cacheTtlMs?: number;
    retryOnRateLimit?: boolean;
    maxRetries?: number;
  } = {}
): Promise<T> {
  const {
    cacheKey,
    cacheTtlMs = 300000, // 5 minutes default
    retryOnRateLimit = true,
    maxRetries = 3,
  } = options;

  // Check cache first
  if (cacheKey) {
    const cached = mapsRateLimiter.getFromCache<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  let retries = 0;

  while (retries <= maxRetries) {
    const check = mapsRateLimiter.canMakeRequest(key);

    if (!check.allowed) {
      if (!retryOnRateLimit) {
        throw new Error(check.reason || 'Rate limit exceeded');
      }

      await new Promise(resolve => setTimeout(resolve, check.waitTime));
      retries++;
      continue;
    }

    try {
      mapsRateLimiter.recordRequest(key);
      const result = await apiCall();

      // Cache the result
      if (cacheKey) {
        mapsRateLimiter.setCache(cacheKey, result, cacheTtlMs);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  throw new Error('Max retries exceeded due to rate limiting');
}
