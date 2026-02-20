import { describe, it, expect } from 'vitest';
import { getCached, setCache } from '../../src/translator/cache.js';

describe('translation cache', () => {
  const testStep = 'test step description';
  const testTree = '{"role": "document"}';

  it('returns null for cache miss', () => {
    const result = getCached('nonexistent step', 'nonexistent tree');
    expect(result).toBeNull();
  });

  it('stores and retrieves from cache', () => {
    setCache(testStep, testTree, {
      playwrightCode: 'await page.click("button")',
      reasoning: 'test reasoning',
    });

    const result = getCached(testStep, testTree);
    expect(result).not.toBeNull();
    expect(result!.playwrightCode).toBe('await page.click("button")');
    expect(result!.reasoning).toBe('test reasoning');
    expect(result!.timestamp).toBeTruthy();
  });
});
