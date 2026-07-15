import { type MutableRefObject, type RefObject, useEffect, useLayoutEffect, useRef } from 'react';
import type { FinishName } from '../engine/finishes';
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

const useSafeLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface UseMetalFxLifecycleOptions {
  canvasRef: RefObject<HTMLCanvasElement>;
  rootRef: RefObject<HTMLDivElement>;
  glowHostRef: RefObject<HTMLDivElement>;
  instanceRef: MutableRefObject<MetalFxInstance | null>;
  glowHandlesRef: MutableRefObject<GlowHandles | null>;
  themeRef: MutableRefObject<PresetTheme>;
  initialWrapperRadiusRef: MutableRefObject<number>;
  shape: 'pill' | 'circle';
  glowEnabled: boolean;
  paused: boolean;
  shaderScale?: number;
  ringCssPx?: number;
  scale: number;
  preset: PresetName;
  finish: FinishName;
  resolvedTheme: PresetTheme;
  resolveRadius: (width: number, height: number) => number;
  setReady: (ready: boolean) => void;
  setFallback: (fallback: boolean) => void;
}

/** Owns renderer and optional glow lifecycles, restoring a plain child if renderer setup fails. */
export function useMetalFxLifecycle({
  canvasRef,
  rootRef,
  glowHostRef,
  instanceRef,
  glowHandlesRef,
  themeRef,
  initialWrapperRadiusRef,
  shape,
  glowEnabled,
  paused,
  shaderScale,
  ringCssPx,
  scale,
  preset,
  finish,
  resolvedTheme,
  resolveRadius,
  setReady,
  setFallback
}: UseMetalFxLifecycleOptions): void {
  const glowEnabledRef = useRef(glowEnabled);
  glowEnabledRef.current = glowEnabled;

  useSafeLayoutEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    const glowHost = glowHostRef.current;
    if (!canvas || !root) return;

    const initialRadius = root.style.getPropertyValue('border-radius');
    const initialRadiusPriority = root.style.getPropertyPriority('border-radius');
    const initialCustomRadius = root.style.getPropertyValue('--mfx-radius');
    const initialCustomRadiusPriority = root.style.getPropertyPriority('--mfx-radius');
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

    const restoreRadiusStyles = () => {
      if (initialRadius) root.style.setProperty('border-radius', initialRadius, initialRadiusPriority);
      else root.style.removeProperty('border-radius');
      if (initialCustomRadius) root.style.setProperty('--mfx-radius', initialCustomRadius, initialCustomRadiusPriority);
      else root.style.removeProperty('--mfx-radius');
    };

    const cleanup = () => {
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      if (resizeRaf !== 0) cancelAnimationFrame(resizeRaf);
      const instance = instanceRef.current;
      if (instance) {
        if (glowHandlesRef.current) {
          deleteGlowHandles(instance);
          unregisterGlowInstance(instance);
        }
        destroyInstance(instance);
      }
      instanceRef.current = null;
      glowHandlesRef.current = null;
      glowHost?.replaceChildren();
      restoreRadiusStyles();
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
        finish,
        theme: resolvedTheme,
        onFirstCopy: () => setReady(true),
        onContextFailure: () => {
          cleanup();
          setFallback(true);
          setReady(true);
        }
      });
      instanceRef.current = instance;
      root.style.setProperty('--mfx-radius', `${initial.cornerRadius}px`);
      root.style.borderRadius = `${initial.cornerRadius}px`;

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
          if (!glowEnabledRef.current || !glowHost || !glowHandlesRef.current) return;
          try {
            glowHost.replaceChildren();
            glowHandlesRef.current = injectGlow(glowHost, {
              width: next.cssWidth,
              height: next.cssHeight,
              cornerRadius: next.cornerRadius,
              kind: shape,
              scale: liveInstance.scale
            });
            setGlowHandles(liveInstance, glowHandlesRef.current, themeRef);
          } catch {
            deleteGlowHandles(liveInstance);
            unregisterGlowInstance(liveInstance);
            glowHandlesRef.current = null;
            glowHost.replaceChildren();
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
      setFallback(false);
    } catch {
      cleanup();
      setFallback(true);
      setReady(true);
    }

    return cleanup;
  }, [shape]);

  // Shape changes replace the renderer instance; scale changes rebuild only
  // the SVG geometry so absolute strokes and offsets remain proportional.
  useEffect(() => {
    const instance = instanceRef.current;
    const glowHost = glowHostRef.current;
    if (!instance || !glowHost || !glowEnabled) return;
    let handles: GlowHandles;
    try {
      handles = injectGlow(glowHost, {
        width: instance.cssWidth,
        height: instance.cssHeight,
        cornerRadius: instance.cornerRadius,
        kind: instance.kind,
        scale: instance.scale
      });
      glowHandlesRef.current = handles;
      setGlowHandles(instance, handles, themeRef);
      registerGlowInstance(instance);
    } catch {
      deleteGlowHandles(instance);
      unregisterGlowInstance(instance);
      glowHandlesRef.current = null;
      glowHost.replaceChildren();
      return;
    }
    return () => {
      if (instanceRef.current !== instance || !glowHandlesRef.current) return;
      deleteGlowHandles(instance);
      unregisterGlowInstance(instance);
      glowHandlesRef.current = null;
      glowHost.replaceChildren();
    };
  }, [glowEnabled, shape, scale]);
}
