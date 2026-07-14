import { type MutableRefObject, type RefObject, useLayoutEffect } from 'react';
import { type GlowHandles, injectGlow } from '../engine/glow/glow';
import { deleteGlowHandles, setGlowHandles } from '../engine/glow/registry';
import type { PresetName, PresetTheme } from '../engine/presets';
import type { MetalFxInstance } from '../engine/renderer/core';
import {
  createInstance,
  destroyInstance,
  registerGlowInstance,
  setInstanceVisible,
  unregisterGlowInstance,
  updateInstance
} from '../engine/renderer/loop';

interface UseMetalFxLifecycleOptions {
  canvasRef: RefObject<HTMLCanvasElement>;
  rootRef: RefObject<HTMLDivElement>;
  glowHostRef: RefObject<HTMLDivElement>;
  instanceRef: MutableRefObject<MetalFxInstance | null>;
  glowHandlesRef: MutableRefObject<GlowHandles | null>;
  themeRef: MutableRefObject<PresetTheme>;
  initialWrapperRadiusRef: MutableRefObject<number>;
  shape: 'pill' | 'circle';
  paused: boolean;
  shaderScale?: number;
  ringCssPx?: number;
  scale: number;
  preset: PresetName;
  resolvedTheme: PresetTheme;
  resolveRadius: (width: number, height: number) => number;
  setReady: (ready: boolean) => void;
  setFallback: (fallback: boolean) => void;
}

/** Owns the mount-to-engine transaction and restores a plain child if it fails. */
export function useMetalFxLifecycle({
  canvasRef,
  rootRef,
  glowHostRef,
  instanceRef,
  glowHandlesRef,
  themeRef,
  initialWrapperRadiusRef,
  shape,
  paused,
  shaderScale,
  ringCssPx,
  scale,
  preset,
  resolvedTheme,
  resolveRadius,
  setReady,
  setFallback
}: UseMetalFxLifecycleOptions): void {
  // biome-ignore lint/correctness/useExhaustiveDependencies: prop updates are synchronized by focused MetalFx effects
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    const glowHost = glowHostRef.current;
    if (!canvas || !root) return;

    const computed = getComputedStyle(root);
    const parsed = parseFloat(computed.borderTopLeftRadius);
    initialWrapperRadiusRef.current = Number.isFinite(parsed) ? parsed : 0;

    const measure = () => {
      const rect = root.getBoundingClientRect();
      const cssWidth = Math.max(1, Math.round(rect.width));
      const cssHeight = Math.max(1, Math.round(rect.height));
      return { cssWidth, cssHeight, cornerRadius: resolveRadius(cssWidth, cssHeight) };
    };

    let resizeRaf = 0;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let glowRegistered = false;

    const cleanup = () => {
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      if (resizeRaf !== 0) cancelAnimationFrame(resizeRaf);
      const instance = instanceRef.current;
      if (instance) {
        deleteGlowHandles(instance);
        if (glowRegistered) unregisterGlowInstance(instance);
        destroyInstance(instance);
      }
      instanceRef.current = null;
      glowHandlesRef.current = null;
      if (glowHost) glowHost.replaceChildren();
    };

    try {
      const initial = measure();
      const instance = createInstance({
        hostCanvas: canvas,
        cssWidth: initial.cssWidth,
        cssHeight: initial.cssHeight,
        cornerRadius: initial.cornerRadius,
        kind: shape,
        paused,
        shaderScale,
        ringCssPx,
        scale,
        preset,
        theme: resolvedTheme,
        onFirstCopy: () => setReady(true)
      });
      instanceRef.current = instance;
      root.style.setProperty('--mfx-radius', `${initial.cornerRadius}px`);
      root.style.borderRadius = `${initial.cornerRadius}px`;

      if (glowHost) {
        glowHandlesRef.current = injectGlow(glowHost, {
          width: initial.cssWidth,
          height: initial.cssHeight,
          cornerRadius: initial.cornerRadius,
          kind: shape,
          scale
        });
      }

      resizeObserver = new ResizeObserver(() => {
        if (resizeRaf !== 0) return;
        resizeRaf = requestAnimationFrame(() => {
          resizeRaf = 0;
          const next = measure();
          const liveInstance = instanceRef.current;
          if (!liveInstance) return;
          updateInstance(liveInstance, {
            cssWidth: next.cssWidth,
            cssHeight: next.cssHeight,
            cornerRadius: next.cornerRadius
          });
          root.style.setProperty('--mfx-radius', `${next.cornerRadius}px`);
          root.style.borderRadius = `${next.cornerRadius}px`;
          if (glowHost) {
            glowHost.replaceChildren();
            glowHandlesRef.current = injectGlow(glowHost, {
              width: next.cssWidth,
              height: next.cssHeight,
              cornerRadius: next.cornerRadius,
              kind: shape,
              scale
            });
            if (glowHandlesRef.current) setGlowHandles(liveInstance, glowHandlesRef.current, themeRef);
          }
        });
      });
      resizeObserver.observe(root);

      if (typeof IntersectionObserver !== 'undefined') {
        intersectionObserver = new IntersectionObserver(
          (entries) => {
            const liveInstance = instanceRef.current;
            if (!liveInstance) return;
            for (const entry of entries) setInstanceVisible(liveInstance, entry.isIntersecting);
          },
          { rootMargin: '64px' }
        );
        intersectionObserver.observe(root);
      }

      if (glowHandlesRef.current) {
        setGlowHandles(instance, glowHandlesRef.current, themeRef);
        registerGlowInstance(instance);
        glowRegistered = true;
      }
      setFallback(false);
    } catch {
      cleanup();
      setFallback(true);
      setReady(true);
    }

    return cleanup;
  }, [shape]);
}
