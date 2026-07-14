import { describe, expect, it } from 'vitest';
import type { MetalFxInstance } from './core';
import { planRenderGroups } from './groups';

function instance(
  preset: MetalFxInstance['preset'],
  theme: MetalFxInstance['theme'],
  paused = false,
  everCopied = false
) {
  return { preset, theme, paused, everCopied, visible: true } as MetalFxInstance;
}

describe('planRenderGroups', () => {
  it('shares one pass for homogeneous instances and separates materials', () => {
    const groups = planRenderGroups([instance('gold', 'dark'), instance('gold', 'dark'), instance('silver', 'light')]);
    expect(groups.map((group) => [group.key, group.instances.length])).toEqual([
      ['gold:dark', 2],
      ['silver:light', 1]
    ]);
  });

  it('skips hidden and fully paused instances but includes an initial paused frame', () => {
    const hidden = instance('gold', 'dark');
    hidden.visible = false;
    expect(
      planRenderGroups([hidden, instance('silver', 'dark', true, true), instance('chromatic', 'dark', true)]).map(
        (g) => g.key
      )
    ).toEqual(['chromatic:dark']);
  });
});
