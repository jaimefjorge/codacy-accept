import { describe, it, expect } from 'vitest';
import { parseInlineSimple } from '../../src/parser/inline.js';

describe('parseInlineSimple', () => {
  it('splits on commas', () => {
    const steps = parseInlineSimple('click login, enter email, click submit');
    expect(steps).toHaveLength(3);
    expect(steps[0].description).toBe('click login');
    expect(steps[1].description).toBe('enter email');
    expect(steps[2].description).toBe('click submit');
  });

  it('splits on dashes', () => {
    const steps = parseInlineSimple('go to homepage — click sign up — see form');
    expect(steps).toHaveLength(3);
  });

  it('auto-numbers steps starting at 1', () => {
    const steps = parseInlineSimple('first, second, third');
    expect(steps[0].index).toBe(1);
    expect(steps[1].index).toBe(2);
    expect(steps[2].index).toBe(3);
  });

  it('classifies assertions correctly', () => {
    const steps = parseInlineSimple('click button, verify heading is visible, see dashboard');
    expect(steps[0].type).toBe('action');
    expect(steps[1].type).toBe('assertion');
    expect(steps[2].type).toBe('assertion');
  });

  it('classifies actions correctly', () => {
    const steps = parseInlineSimple('click submit, enter email, navigate to page');
    expect(steps[0].type).toBe('action');
    expect(steps[1].type).toBe('action');
    expect(steps[2].type).toBe('action');
  });

  it('handles single step', () => {
    const steps = parseInlineSimple('verify the homepage loads');
    expect(steps).toHaveLength(1);
    expect(steps[0].type).toBe('assertion');
  });

  it('splits on newlines', () => {
    const steps = parseInlineSimple('click login\nenter email\nclick submit');
    expect(steps).toHaveLength(3);
  });

  it('filters empty fragments', () => {
    const steps = parseInlineSimple('click login,, ,enter email');
    expect(steps).toHaveLength(2);
  });
});
