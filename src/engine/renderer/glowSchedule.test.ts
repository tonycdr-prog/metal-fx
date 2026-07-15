import { describe, expect, it } from 'vitest';
import { GLOW_MAX_UPDATES_PER_FRAME, GLOW_UPDATE_INTERVAL_MS } from '../perfConfig';
import type { MetalFxInstance } from './core';
import { planGlowUpdates } from './glowSchedule';

function instance(overrides: Partial<MetalFxInstance> = {}): MetalFxInstance {
  return { glowUpdateMs: -Infinity, paused: false, visible: true, ...overrides } as MetalFxInstance;
}

describe('planGlowUpdates', () => {
  it('bounds each frame while rotating fairly through a 25-instance queue', () => {
    const queue = Array.from({ length: 25 }, () => instance());
    let index = 0;
    const visited = new Set<MetalFxInstance>();
    for (let frame = 0; frame < Math.ceil(queue.length / GLOW_MAX_UPDATES_PER_FRAME); frame++) {
      const plan = planGlowUpdates(queue, index, frame * GLOW_UPDATE_INTERVAL_MS);
      expect(plan.instances.length).toBeLessThanOrEqual(GLOW_MAX_UPDATES_PER_FRAME);
      for (const candidate of plan.instances) visited.add(candidate);
      index = plan.nextIndex;
    }
    expect(visited.size).toBe(25);
  });

  it('skips ineligible and recently updated instances without losing queue progress', () => {
    const hidden = instance({ visible: false });
    const paused = instance({ paused: true });
    const recent = instance({ glowUpdateMs: 900 });
    const due = instance();
    const plan = planGlowUpdates([hidden, paused, recent, due], 0, 1_000);
    expect(plan.instances).toEqual([due]);
    expect(plan.nextIndex).toBe(0);
  });
});
