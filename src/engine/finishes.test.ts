import { describe, expect, it } from 'vitest';
import { FINISHES } from './finishes';

describe('finish profiles', () => {
  it('keeps polished neutral so the default shader output is unchanged', () => {
    expect(FINISHES.polished).toMatchObject({
      name: 'polished',
      grain: 0,
      grainScale: 1,
      flow: 0,
      spectral: 0,
      contrast: 1,
      speed: 1
    });
  });

  it('defines distinct bounded responses for every experimental finish', () => {
    const signatures = Object.values(FINISHES).map(({ grain, grainScale, flow, spectral, contrast, speed }) =>
      JSON.stringify({ grain, grainScale, flow, spectral, contrast, speed })
    );
    expect(new Set(signatures)).toHaveLength(4);
    for (const [name, finish] of Object.entries(FINISHES)) {
      expect(finish.name).toBe(name);
      expect(finish.grain).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(finish.grainScale)).toBe(true);
      expect(finish.grainScale).toBeGreaterThanOrEqual(0);
      expect(finish.flow).toBeGreaterThanOrEqual(0);
      expect(finish.spectral).toBeGreaterThanOrEqual(0);
      expect(finish.contrast).toBeGreaterThan(0);
      expect(finish.speed).toBeGreaterThan(0);
    }
  });
});
