import { CIRCLE_SHADER_SCALE, type MetalFxInstance, PILL_SHADER_SCALE } from './core';

export function defaultRingCssPx(kind: MetalFxInstance['kind'], scale: number): number {
  return (kind === 'circle' ? 2 : 1) * scale;
}

export function defaultShaderScale(kind: MetalFxInstance['kind'], scale: number): number {
  return (kind === 'circle' ? CIRCLE_SHADER_SCALE : PILL_SHADER_SCALE) * scale;
}
