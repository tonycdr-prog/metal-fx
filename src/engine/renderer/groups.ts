import { FINISHES, type FinishProfile } from '../finishes';
import { PRESETS, type PresetMode } from '../presets';
import type { MetalFxInstance } from './core';

export interface RenderGroup {
  key: string;
  mode: PresetMode;
  finish: FinishProfile;
  lightX: number;
  lightY: number;
  lightIntensity: number;
  press: number;
  instances: MetalFxInstance[];
}

export function planRenderGroups(instances: Iterable<MetalFxInstance>): RenderGroup[] {
  const groups = new Map<string, RenderGroup>();
  for (const instance of instances) {
    if (!instance.visible || (instance.paused && instance.everCopied)) continue;
    const key = `${instance.preset}:${instance.theme}:${instance.finish}:${instance.lightX}:${instance.lightY}:${instance.lightIntensity}:${instance.press}`;
    const group = groups.get(key) ?? {
      key,
      mode: PRESETS[instance.preset].modes[instance.theme],
      finish: FINISHES[instance.finish],
      lightX: instance.lightX,
      lightY: instance.lightY,
      lightIntensity: instance.lightIntensity,
      press: instance.press,
      instances: []
    };
    group.instances.push(instance);
    groups.set(key, group);
  }
  return [...groups.values()];
}
