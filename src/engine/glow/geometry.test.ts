import { describe, expect, it } from 'vitest';
import { rrPerim, sampleAtArc, shapePerim, smoothstep } from './geometry';

describe('glow geometry', () => {
  it('clamps rounded rectangle radii and preserves the circle perimeter contract', () => {
    expect(rrPerim(10, 8, 100)).toBeCloseTo(4 + 8 * Math.PI);
    expect(shapePerim(10, 8, 100, 'circle')).toBeCloseTo(8 * Math.PI);
  });

  it('wraps circle samples and clamps smoothstep endpoints', () => {
    const first = sampleAtArc(0, 40, 40, 20, 0, 0, 'circle');
    const wrapped = sampleAtArc(Math.PI * 40, 40, 40, 20, 0, 0, 'circle');
    expect(wrapped).toEqual(first);
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 2)).toBe(1);
  });
});
