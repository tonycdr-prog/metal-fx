// @vitest-environment node
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MetalFx } from './MetalFx';

describe('server rendering', () => {
  it('imports and renders without accessing browser globals', () => {
    expect(
      renderToString(createElement(MetalFx, null, createElement('button', { type: 'button' }, 'Use effect')))
    ).toContain('Use effect');
  });

  it.todo('hydrates an auto-themed MetalFx without React warnings (REQ-004 and REQ-005)');
});
