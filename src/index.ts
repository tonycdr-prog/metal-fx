// Power-user surface: expose the engine primitives so consumers building
// non-React integrations can drive the same renderer.

export { hexToRgb } from './engine/color';
export { FINISHES, type FinishName, type FinishProfile } from './engine/finishes';
export {
  isMetalFxMaterialName,
  MATERIALS,
  type MetalFxMaterial,
  type MetalFxMaterialName,
  resolveMaterial
} from './engine/materials';
export {
  PRESETS,
  type Preset,
  type PresetMode,
  type PresetName,
  type PresetTheme
} from './engine/presets';
export type { MetalFxInstance } from './engine/renderer/core';
export {
  createInstance,
  destroyInstance,
  pauseShared,
  resumeShared,
  setSharedPreset,
  updateInstance
} from './engine/renderer/loop';
export { MetalFx } from './MetalFx';
export type {
  MetalFxFinish,
  MetalFxPreset,
  MetalFxProps,
  MetalFxTheme,
  MetalFxVariant
} from './types';
