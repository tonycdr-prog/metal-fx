import { describe, expect, it } from 'vitest';
import { FINISHES, type FinishName } from '../finishes';
import { PRESETS } from '../presets';
import type { MetalFxInstance } from './core';
import { planRenderGroups } from './groups';

function instance(
  preset: MetalFxInstance['preset'],
  theme: MetalFxInstance['theme'],
  paused = false,
  everCopied = false,
  finish: FinishName = 'polished'
) {
  return { preset, theme, paused, everCopied, visible: true, finish } as MetalFxInstance;
}

describe('planRenderGroups', () => {
  it('shares one pass for homogeneous instances and separates materials', () => {
    const groups = planRenderGroups([
      instance('gold', 'dark'),
      instance('gold', 'dark'),
      instance('silver', 'light'),
      instance('gold', 'dark', false, false, 'brushed')
    ]);
    expect(groups.map((group) => [group.key, group.instances.length])).toEqual([
      ['gold:dark:polished', 2],
      ['silver:light:polished', 1],
      ['gold:dark:brushed', 1]
    ]);
    expect(groups[0].mode).toBe(PRESETS.gold.modes.dark);
    expect(groups[1].mode).toBe(PRESETS.silver.modes.light);
    expect(groups[2].finish).toBe(FINISHES.brushed);
  });

  it('skips hidden and fully paused instances but includes an initial paused frame', () => {
    const hidden = instance('gold', 'dark');
    hidden.visible = false;
    expect(
      planRenderGroups([hidden, instance('silver', 'dark', true, true), instance('chromatic', 'dark', true)]).map(
        (g) => g.key
      )
    ).toEqual(['chromatic:dark:polished']);
  });
});
