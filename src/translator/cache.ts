import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { CacheEntry } from '../types.js';

const CACHE_DIR = '.accept/cache';

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function cacheKey(stepDescription: string, a11ySnapshot: string): string {
  const hash = createHash('sha256');
  hash.update(stepDescription);
  hash.update(a11ySnapshot);
  return hash.digest('hex').slice(0, 16);
}

export function getCached(stepDescription: string, a11ySnapshot: string): CacheEntry | null {
  const key = cacheKey(stepDescription, a11ySnapshot);
  const path = join(CACHE_DIR, `${key}.json`);

  if (!existsSync(path)) {
    return null;
  }

  try {
    const data = readFileSync(path, 'utf-8');
    return JSON.parse(data) as CacheEntry;
  } catch {
    return null;
  }
}

export function setCache(
  stepDescription: string,
  a11ySnapshot: string,
  entry: Omit<CacheEntry, 'timestamp'>,
): void {
  ensureCacheDir();
  const key = cacheKey(stepDescription, a11ySnapshot);
  const path = join(CACHE_DIR, `${key}.json`);

  const fullEntry: CacheEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  writeFileSync(path, JSON.stringify(fullEntry, null, 2));
}
