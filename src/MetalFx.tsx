import { type CSSProperties, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { GlowHandles } from './engine/glow/glow';
import { addReflectionTarget, removeReflectionTarget } from './engine/reflection/paint';
import { scheduleReflectionPaint } from './engine/reflection/reflectionScheduler';
import type { MetalFxInstance } from './engine/renderer/core';
import { updateInstance } from './engine/renderer/loop';
import { useMaterialInteraction } from './hooks/useMaterialInteraction';
import { useMetalFxLifecycle } from './hooks/useMetalFxLifecycle';
import { useResolvedTheme } from './hooks/useResolvedTheme';
import { ensureStylesInjected } from './styles';
import type { MetalFxProps } from './types';

// Runs at module scope so styles exist before the first component render,
// even in SSR-hydration scenarios where effects haven't fired yet.
ensureStylesInjected();

const CANVAS_STYLE: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' };
const INNER_STYLE: CSSProperties = { position: 'absolute', inset: 3 };
const GLOW_HOST_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 3,
  borderRadius: 'inherit'
};

/**
 * Wraps any element with an animated metallic ring effect driven by a
 * single shared WebGL renderer. All visible MetalFx instances on the page
 * share one offscreen GL canvas; each instance composites a cropped/scaled
 * copy of it onto its own 2D canvas with a rounded hole punched through the
 * centre.
 */
export const MetalFx = forwardRef<HTMLDivElement, MetalFxProps>(function MetalFx(
  {
    children,
    variant = 'button',
    preset = 'chromatic',
    finish = 'polished',
    interactive = false,
    theme = 'auto',
    strength = 1,
    paused = false,
    borderRadius,
    normalizeHostStyles = true,
    reflectionTargets,
    disableGlow = false,
    shaderScale,
    ringCssPx,
    scale = 1,
    className,
    style,
    ...rest
  },
  forwardedRef
) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glowHostRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<MetalFxInstance | null>(null);
  const glowHandlesRef = useRef<GlowHandles | null>(null);
  const themeRef = useRef<'dark' | 'light'>('dark');
  const initialWrapperRadiusRef = useRef<number>(0);

  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const resolvedTheme = useResolvedTheme(theme);
  themeRef.current = resolvedTheme;
  const shape: 'pill' | 'circle' = variant === 'circle' ? 'circle' : 'pill';
  const glowEnabled = !disableGlow;

  useImperativeHandle(forwardedRef, () => rootRef.current as HTMLDivElement, []);

  const resolveRadius = (width: number, height: number) => {
    if (shape === 'circle') return Math.min(width, height) / 2;

    const raw =
      typeof borderRadius === 'number'
        ? borderRadius
        : (() => {
            const child = contentRef.current?.firstElementChild as HTMLElement | null;
            if (child) {
              const parsed = parseFloat(getComputedStyle(child).borderTopLeftRadius);
              if (Number.isFinite(parsed) && parsed > 0) return parsed;
            }
            return initialWrapperRadiusRef.current;
          })();
    return Math.min(raw, Math.min(width, height) / 2);
  };

  useEffect(() => {
    const instance = instanceRef.current;
    if (instance) updateInstance(instance, { preset, theme: resolvedTheme, finish });
  }, [preset, resolvedTheme, finish]);

  useEffect(() => {
    const instance = instanceRef.current;
    if (instance) updateInstance(instance, { paused });
  }, [paused]);

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;
    const patch: Partial<Parameters<typeof updateInstance>[1]> = {};
    if (shaderScale !== undefined) patch.shaderScale = shaderScale;
    if (ringCssPx !== undefined) patch.ringCssPx = ringCssPx;
    patch.scale = scale;
    updateInstance(instance, patch);
  }, [shaderScale, ringCssPx, scale]);

  useMetalFxLifecycle({
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
  });

  useMaterialInteraction({ enabled: interactive, instanceRef, rootRef });

  useEffect(() => {
    const instance = instanceRef.current;
    if (instance) updateInstance(instance, { opacityMul: Math.max(0, Math.min(1, strength)) });
  }, [strength]);

  useEffect(() => {
    const instance = instanceRef.current;
    const root = rootRef.current;
    if (fallback || !instance || !root || !reflectionTargets || resolvedTheme !== 'dark') return;
    instance.onAfterFrame = scheduleReflectionPaint;
    const live = reflectionTargets.flatMap((target) => (target.current ? [target.current] : []));
    for (const element of live) addReflectionTarget(element, instance, root);
    return () => {
      instance.onAfterFrame = undefined;
      for (const element of live) removeReflectionTarget(element, instance);
    };
  }, [fallback, reflectionTargets, resolvedTheme]);

  // Shape is included because it is the renderer-recreation trigger; theme is
  // included because automatic theme resolution can change after hydration.
  useEffect(() => {
    const root = rootRef.current;
    const instance = instanceRef.current;
    if (!root || !instance) return;
    const cornerRadius = resolveRadius(instance.cssWidth, instance.cssHeight);
    updateInstance(instance, { cornerRadius });
    root.style.setProperty('--mfx-radius', `${cornerRadius}px`);
    root.style.borderRadius = `${cornerRadius}px`;
  }, [borderRadius, resolvedTheme, variant, shape]);

  const wrapperStyle = useMemo<CSSProperties>(
    () => ({
      ...style,
      ['--mfx-strength' as string]: String(Math.min(1, Math.max(0, strength))),
      opacity: ready ? 1 : 0,
      visibility: ready ? 'visible' : 'hidden',
      transition: ready ? 'opacity 0.15s ease-out' : 'none'
    }),
    [style, strength, ready]
  );

  return (
    <div
      {...rest}
      ref={rootRef}
      className={className ? `metal-fx-root ${className}` : 'metal-fx-root'}
      data-variant={variant}
      data-shape={shape}
      data-theme={resolvedTheme}
      data-finish={finish}
      data-interactive={interactive ? 'true' : undefined}
      data-paused={paused ? 'true' : undefined}
      data-fallback={fallback ? 'true' : undefined}
      data-normalize={!fallback && normalizeHostStyles ? 'true' : 'false'}
      style={wrapperStyle}
    >
      <canvas ref={canvasRef} className="metal-fx-canvas" style={CANVAS_STYLE} />
      <div className="metal-fx-inner" aria-hidden="true" style={INNER_STYLE} />
      <div
        ref={glowHostRef}
        aria-hidden="true"
        style={{ ...GLOW_HOST_STYLE, display: glowEnabled && !fallback ? undefined : 'none' }}
      />
      <div ref={contentRef} className="metal-fx-content">
        {children}
      </div>
    </div>
  );
});

MetalFx.displayName = 'MetalFx';
