import { CIRCLE_SHADER_SCALE, type MetalFxInstance, PILL_SHADER_SCALE } from './core';

type ScalePatch = Partial<Pick<MetalFxInstance, 'kind' | 'ringCssPx' | 'scale' | 'shaderScale'>>;

interface ScaleOverrides {
  ringCssPx: boolean;
  shaderScale: boolean;
}

const SCALE_OVERRIDES = new WeakMap<MetalFxInstance, ScaleOverrides>();

export function defaultRingCssPx(kind: MetalFxInstance['kind'], scale: number): number {
  return (kind === 'circle' ? 2 : 1) * scale;
}

export function defaultShaderScale(kind: MetalFxInstance['kind'], scale: number): number {
  return (kind === 'circle' ? CIRCLE_SHADER_SCALE : PILL_SHADER_SCALE) * scale;
}

export function registerScaleOverrides(inst: MetalFxInstance, initial: ScalePatch): void {
  SCALE_OVERRIDES.set(inst, {
    ringCssPx: initial.ringCssPx !== undefined,
    shaderScale: initial.shaderScale !== undefined
  });
}

export function applyScalePatch(inst: MetalFxInstance, patch: ScalePatch): void {
  const overrides = SCALE_OVERRIDES.get(inst) ?? { ringCssPx: false, shaderScale: false };

  if (patch.scale !== undefined && patch.scale !== inst.scale) {
    inst.scale = patch.scale;
    if (patch.shaderScale === undefined && !overrides.shaderScale)
      inst.shaderScale = defaultShaderScale(inst.kind, inst.scale);
    if (patch.ringCssPx === undefined && !overrides.ringCssPx) inst.ringCssPx = defaultRingCssPx(inst.kind, inst.scale);
  }

  if (patch.kind !== undefined && patch.kind !== inst.kind) {
    inst.kind = patch.kind;
    if (patch.shaderScale === undefined && !overrides.shaderScale)
      inst.shaderScale = defaultShaderScale(inst.kind, inst.scale);
    if (patch.ringCssPx === undefined && !overrides.ringCssPx) inst.ringCssPx = defaultRingCssPx(inst.kind, inst.scale);
  }

  if (patch.shaderScale !== undefined) {
    inst.shaderScale = patch.shaderScale;
    overrides.shaderScale = true;
  }
  if (patch.ringCssPx !== undefined) {
    inst.ringCssPx = patch.ringCssPx;
    overrides.ringCssPx = true;
  }
  SCALE_OVERRIDES.set(inst, overrides);
}
