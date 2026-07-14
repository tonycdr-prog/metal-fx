import type { MetalFxInstance } from '../renderer/core';
import { setGlowCallback } from '../renderer/loop';
import { type GlowHandles, updateGlow } from './glow';

type ThemeRef = { current: 'dark' | 'light' };
const glowHandles = new Map<MetalFxInstance, { handles: GlowHandles; themeRef: ThemeRef }>();

// The renderer owns scheduling while this registry owns glow implementation state.
setGlowCallback((instance, nowMs) => {
  const entry = glowHandles.get(instance);
  if (!entry) return;
  updateGlow(entry.handles, instance, nowMs, instance.opacityMul, entry.themeRef.current);
});

export function setGlowHandles(instance: MetalFxInstance, handles: GlowHandles, themeRef: ThemeRef): void {
  glowHandles.set(instance, { handles, themeRef });
}

export function deleteGlowHandles(instance: MetalFxInstance): void {
  glowHandles.delete(instance);
}
