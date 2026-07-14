import { describe, expect, it } from 'vitest';
import { hexToRgb, hsvToRgb, rgbToHsv } from './color';

describe('color transforms', () => {
  it('normalizes three and six digit hex values', () => {
    expect(hexToRgb('#0af')).toEqual([0, 170 / 255, 1]);
    expect(hexToRgb('ff8000')).toEqual([1, 128 / 255, 0]);
  });

  it('round-trips representative RGB values through HSV', () => {
    expect(hsvToRgb(...rgbToHsv(42, 128, 240))).toEqual([42, 128, 240]);
    expect(hsvToRgb(...rgbToHsv(0, 0, 0))).toEqual([0, 0, 0]);
  });
});
