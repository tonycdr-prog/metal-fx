import { describe, expect, it } from 'vitest';
import { getReflectionScaleMetrics } from './paint';

describe('getReflectionScaleMetrics', () => {
  it('scales stroke, highlight, and reference draw dimensions for 1 → 2 → 0.5', () => {
    expect(getReflectionScaleMetrics(1, 2, 0, 140)).toEqual({
      strokeBandPx: 2,
      borderHighlightPx: 2,
      referenceDrawPx: 470
    });
    expect(getReflectionScaleMetrics(2, 2, 0, 140)).toEqual({
      strokeBandPx: 4,
      borderHighlightPx: 4,
      referenceDrawPx: 940
    });
    expect(getReflectionScaleMetrics(0.5, 2, 0, 140)).toEqual({
      strokeBandPx: 1,
      borderHighlightPx: 1,
      referenceDrawPx: 235
    });
  });
});
