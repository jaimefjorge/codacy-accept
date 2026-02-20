import { CacheEntry } from '../types.js';
export declare function getCached(stepDescription: string, a11ySnapshot: string): CacheEntry | null;
export declare function setCache(stepDescription: string, a11ySnapshot: string, entry: Omit<CacheEntry, 'timestamp'>): void;
//# sourceMappingURL=cache.d.ts.map