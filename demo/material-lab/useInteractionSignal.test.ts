import { describe, expect, it } from 'vitest';
import { clampInteractionSignal } from './useInteractionSignal';

describe('interaction signals', () => {
  it('bounds presentation signals', () => {
    expect(clampInteractionSignal(-2)).toBe(-1);
    expect(clampInteractionSignal(0.4)).toBe(0.4);
    expect(clampInteractionSignal(2)).toBe(1);
  });
});
