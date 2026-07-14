import { describe, expect, it } from 'vitest';
import { ease, tween, tweenStart, tweenTick } from './tween';

describe('tween', () => {
  it('does not advance before starting and clamps at the destination', () => {
    const value = tween(2, 10, 100);
    expect(tweenTick(value, 0)).toBe(2);
    tweenStart(value, 50);
    expect(tweenTick(value, 100)).toBe(6);
    expect(tweenTick(value, 500)).toBe(10);
    expect(value.done).toBe(true);
  });

  it('applies the selected easing function', () => {
    const value = tween(0, 1, 100, ease.smoothstep);
    tweenStart(value, 0);
    expect(tweenTick(value, 25)).toBeCloseTo(0.15625);
  });
});
