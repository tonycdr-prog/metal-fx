// @vitest-environment node
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MetalFx } from './MetalFx';

describe('server rendering', () => {
  it('imports and renders without accessing browser globals', () => {
    expect('ResizeObserver' in globalThis).toBe(false);
    expect('IntersectionObserver' in globalThis).toBe(false);
    const errors = vi.spyOn(console, 'error');
    const warnings = vi.spyOn(console, 'warn');
    expect(
      renderToString(createElement(MetalFx, null, createElement('button', { type: 'button' }, 'Use effect')))
    ).toContain('Use effect');
    expect(errors).not.toHaveBeenCalled();
    expect(warnings).not.toHaveBeenCalled();
    errors.mockRestore();
    warnings.mockRestore();
  });
});
