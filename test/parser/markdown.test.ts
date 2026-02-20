import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '../../src/parser/markdown.js';

describe('parseMarkdown', () => {
  it('parses a complete spec', () => {
    const content = `# Checkout Flow

- App: http://localhost:3000

> Why: Checkout is 80% of revenue.

1. Navigate to the product page
2. Click add to cart
3. Verify cart shows 1 item
4. Click checkout
5. See the payment form
`;
    const spec = parseMarkdown(content);
    expect(spec.title).toBe('Checkout Flow');
    expect(spec.url).toBe('http://localhost:3000');
    expect(spec.why).toBe('Checkout is 80% of revenue.');
    expect(spec.steps).toHaveLength(5);
    expect(spec.steps[0].description).toBe('Navigate to the product page');
    expect(spec.steps[2].type).toBe('assertion');
    expect(spec.steps[4].type).toBe('assertion');
  });

  it('parses URL with URL: prefix', () => {
    const content = `# Test
- URL: https://example.com
1. Click button
`;
    const spec = parseMarkdown(content);
    expect(spec.url).toBe('https://example.com');
  });

  it('handles missing why block', () => {
    const content = `# Simple Test
- App: http://localhost:3000
1. Click button
`;
    const spec = parseMarkdown(content);
    expect(spec.why).toBeUndefined();
  });

  it('handles missing title gracefully', () => {
    const content = `- App: http://localhost:3000
1. Click button
`;
    const spec = parseMarkdown(content);
    expect(spec.title).toBe('Untitled Spec');
  });

  it('classifies step types correctly', () => {
    const content = `# Test
- App: http://localhost:3000
1. Click the login button
2. Enter email address
3. Verify dashboard is visible
4. Check that no errors appear
`;
    const spec = parseMarkdown(content);
    expect(spec.steps[0].type).toBe('action');
    expect(spec.steps[1].type).toBe('action');
    expect(spec.steps[2].type).toBe('assertion');
    expect(spec.steps[3].type).toBe('assertion');
  });

  it('numbers steps sequentially', () => {
    const content = `# Test
- App: http://localhost:3000
1. Step one
2. Step two
3. Step three
`;
    const spec = parseMarkdown(content);
    expect(spec.steps[0].index).toBe(1);
    expect(spec.steps[1].index).toBe(2);
    expect(spec.steps[2].index).toBe(3);
  });
});
