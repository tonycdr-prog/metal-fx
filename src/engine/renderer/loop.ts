/** Animation loop, per-frame compositing, and instance lifecycle. */

import type { FinishName } from '../finishes';
import { COMPOSITE_DPR_CAP, FRAME_INTERVAL_MS } from '../perfConfig';
import { PRESETS, type PresetName, type PresetTheme } from '../presets';
import {
  CANONICAL_PILL_H,
  CANONICAL_PILL_W,
  ensureSharedRenderer,
  type MetalFxInstance,
  SHARED,
  setContextRestoredCallback,
  teardownSharedRenderer
} from './core';
import { planGlowUpdates } from './glowSchedule';
import { planRenderGroups } from './groups';
import { renderSharedFrame } from './render';
import { ensureGlowPixels } from './sampling';
import { applyScalePatch, defaultRingCssPx, defaultShaderScale, registerScaleOverrides } from './scale';

// Restart the animation loop when the browser restores the GL context.
setContextRestoredCallback(() => {
  if (SHARED && SHARED.instances.size > 0 && SHARED.pausedAtMs === null) {
    startSharedLoop();
  }
});

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!SHARED || SHARED.pausedAtMs !== null || SHARED.contextLost) return;
    if (document.hidden) {
      stopSharedLoop();
    } else if (SHARED.instances.size > 0) {
      startSharedLoop();
    }
  });
}

// ─── Instance lifecycle ───────────────────────────────────────────────────

interface CreateInstanceOptions {
  hostCanvas: HTMLCanvasElement;
  cssWidth: number;
  cssHeight: number;
  cornerRadius: number;
  kind: 'pill' | 'circle';
  shaderScale?: number;
  ringCssPx?: number;
  opacityMul?: number;
  paused?: boolean;
  scale?: number;
  preset?: PresetName;
  finish?: FinishName;
  theme?: PresetTheme;
  onAfterFrame?: () => void;
  onFirstCopy?: () => void;
  onContextFailure?: () => void;
}

export function createInstance(opts: CreateInstanceOptions): MetalFxInstance {
  const ctx = opts.hostCanvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('metal-fx: canvas 2D context unavailable');
  const renderer = ensureSharedRenderer();

  const scale = opts.scale ?? 1;
  let instance: MetalFxInstance | null = null;
  try {
    instance = {
      canvas: opts.hostCanvas,
      ctx,
      cssWidth: opts.cssWidth,
      cssHeight: opts.cssHeight,
      cornerRadius: opts.cornerRadius,
      kind: opts.kind,
      ringCssPx: opts.ringCssPx ?? defaultRingCssPx(opts.kind, scale),
      shaderScale: opts.shaderScale ?? defaultShaderScale(opts.kind, scale),
      opacityMul: opts.opacityMul ?? 1,
      visible: true,
      paused: opts.paused ?? false,
      everCopied: false,
      dpr: Math.min(COMPOSITE_DPR_CAP, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1),
      scale,
      preset: opts.preset ?? renderer.defaultPresetName,
      theme: opts.theme ?? renderer.defaultPresetTheme,
      finish: opts.finish ?? renderer.defaultFinishName,
      lightX: 0.5,
      lightY: 0.5,
      lightIntensity: 0,
      press: 0,
      glowPixels: new Uint8Array(0),
      glowPixelsW: 0,
      glowPixelsH: 0,
      glowReadbackMs: -Infinity,
      glowUpdateMs: -Infinity,
      onAfterFrame: opts.onAfterFrame,
      onFirstCopy: opts.onFirstCopy,
      onContextFailure: opts.onContextFailure
    };
    registerScaleOverrides(instance, opts);
    resizeInstanceCanvas(instance);
    renderer.instances.add(instance);
    if (renderer.rafId === 0 && renderer.pausedAtMs === null) startSharedLoop();
    return instance;
  } catch (error) {
    if (instance) renderer.instances.delete(instance);
    if (renderer.instances.size === 0) teardownSharedRenderer();
    throw error;
  }
}

export function destroyInstance(inst: MetalFxInstance): void {
  if (!SHARED) return;
  SHARED.instances.delete(inst);
  const qi = SHARED.glowQueue.indexOf(inst);
  if (qi !== -1) SHARED.glowQueue.splice(qi, 1);
  if (SHARED.instances.size === 0) {
    stopSharedLoop();
    teardownSharedRenderer();
  }
}

export function registerGlowInstance(inst: MetalFxInstance): void {
  if (!SHARED) return;
  if (!SHARED.glowQueue.includes(inst)) SHARED.glowQueue.push(inst);
}

export function unregisterGlowInstance(inst: MetalFxInstance): void {
  if (!SHARED) return;
  const i = SHARED.glowQueue.indexOf(inst);
  if (i !== -1) SHARED.glowQueue.splice(i, 1);
}

export function updateInstance(
  inst: MetalFxInstance,
  patch: Partial<
    Pick<
      MetalFxInstance,
      | 'cssWidth'
      | 'cssHeight'
      | 'cornerRadius'
      | 'kind'
      | 'shaderScale'
      | 'ringCssPx'
      | 'opacityMul'
      | 'paused'
      | 'scale'
      | 'preset'
      | 'theme'
      | 'finish'
      | 'lightX'
      | 'lightY'
      | 'lightIntensity'
      | 'press'
    >
  >
): void {
  let dirty = false;
  if (patch.cssWidth !== undefined && patch.cssWidth !== inst.cssWidth) {
    inst.cssWidth = patch.cssWidth;
    dirty = true;
  }
  if (patch.cssHeight !== undefined && patch.cssHeight !== inst.cssHeight) {
    inst.cssHeight = patch.cssHeight;
    dirty = true;
  }
  let visualDirty = dirty;
  if (patch.cornerRadius !== undefined && patch.cornerRadius !== inst.cornerRadius) {
    inst.cornerRadius = patch.cornerRadius;
    visualDirty = true;
  }
  applyScalePatch(inst, patch);
  if (patch.scale !== undefined || patch.shaderScale !== undefined || patch.ringCssPx !== undefined) visualDirty = true;
  if (patch.opacityMul !== undefined && patch.opacityMul !== inst.opacityMul) {
    inst.opacityMul = patch.opacityMul;
    visualDirty = true;
  }
  if (patch.preset !== undefined && patch.preset !== inst.preset) {
    inst.preset = patch.preset;
    visualDirty = true;
  }
  if (patch.theme !== undefined && patch.theme !== inst.theme) {
    inst.theme = patch.theme;
    visualDirty = true;
  }
  if (patch.finish !== undefined && patch.finish !== inst.finish) {
    inst.finish = patch.finish;
    visualDirty = true;
  }
  if (patch.lightX !== undefined && patch.lightX !== inst.lightX) {
    inst.lightX = patch.lightX;
    visualDirty = true;
  }
  if (patch.lightY !== undefined && patch.lightY !== inst.lightY) {
    inst.lightY = patch.lightY;
    visualDirty = true;
  }
  if (patch.lightIntensity !== undefined && patch.lightIntensity !== inst.lightIntensity) {
    inst.lightIntensity = patch.lightIntensity;
    visualDirty = true;
  }
  if (patch.press !== undefined && patch.press !== inst.press) {
    inst.press = patch.press;
    visualDirty = true;
  }
  if (patch.paused !== undefined && patch.paused !== inst.paused) {
    inst.paused = patch.paused;
    // Unpausing should kick the loop if it had idled because every visible
    // instance was paused.
    if (!patch.paused && SHARED && SHARED.rafId === 0 && SHARED.pausedAtMs === null && !SHARED.contextLost) {
      startSharedLoop();
    }
  }
  if (dirty) resizeInstanceCanvas(inst);
  if (visualDirty) {
    inst.everCopied = false;
    if (inst.visible && SHARED && SHARED.rafId === 0 && SHARED.pausedAtMs === null && !SHARED.contextLost) {
      startSharedLoop();
    }
  }
}

export function setInstanceVisible(inst: MetalFxInstance, visible: boolean): void {
  inst.visible = visible;
  if (visible && SHARED && SHARED.rafId === 0 && SHARED.pausedAtMs === null && !SHARED.contextLost) {
    startSharedLoop();
  }
}

export function setSharedPreset(name: PresetName, theme: PresetTheme): void {
  const s = ensureSharedRenderer();
  s.defaultPresetName = name;
  s.defaultPresetTheme = theme;
  s.preset = PRESETS[name].modes[theme];
  s.presetDirty = true;
  for (const instance of s.instances) {
    instance.preset = name;
    instance.theme = theme;
  }
}

export function pauseShared(): void {
  if (!SHARED || SHARED.pausedAtMs !== null) return;
  SHARED.pausedAtMs = performance.now();
  stopSharedLoop();
}

export function resumeShared(): void {
  if (!SHARED || SHARED.pausedAtMs === null) return;
  SHARED.pausedMs += performance.now() - SHARED.pausedAtMs;
  SHARED.pausedAtMs = null;
  if (SHARED.instances.size > 0) startSharedLoop();
}

export function getSharedFrameCount(): number {
  return SHARED?.frameCount ?? 0;
}

// ─── Glow callback ────────────────────────────────────────────────────────

export type GlowCallback = (inst: MetalFxInstance, nowMs: number) => void;
let _glowCallback: GlowCallback | null = null;

export function setGlowCallback(cb: GlowCallback | null): void {
  _glowCallback = cb;
}

// ─── Internal rendering ───────────────────────────────────────────────────

function resizeInstanceCanvas(inst: MetalFxInstance): void {
  inst.dpr = Math.min(COMPOSITE_DPR_CAP, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
  const w = Math.max(1, Math.round(inst.cssWidth * inst.dpr));
  const h = Math.max(1, Math.round(inst.cssHeight * inst.dpr));
  if (inst.canvas.width !== w) inst.canvas.width = w;
  if (inst.canvas.height !== h) inst.canvas.height = h;
}

function punchInnerHole(inst: MetalFxInstance): void {
  const { ctx, dpr, canvas } = inst;
  const stroke = inst.ringCssPx * dpr;
  const w = canvas.width,
    h = canvas.height;
  const innerR = Math.max(0, (inst.cornerRadius - inst.ringCssPx) * dpr);
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.roundRect(stroke, stroke, w - 2 * stroke, h - 2 * stroke, innerR);
  ctx.fill();
  ctx.restore();
}

function copyShaderToInstance(inst: MetalFxInstance, src: CanvasImageSource): void {
  if (!SHARED) return;
  const dpr = inst.dpr;
  const dw = inst.canvas.width,
    dh = inst.canvas.height;
  if (dw < 1 || dh < 1) return;

  const cw = SHARED.glCanvas.width,
    ch = SHARED.glCanvas.height;
  const bdW = CANONICAL_PILL_W * dpr,
    bdH = CANONICAL_PILL_H * dpr;
  let srcW = (dw * (cw / bdW)) / inst.shaderScale;
  let srcH = (dh * (ch / bdH)) / inst.shaderScale;
  if (srcW > cw) srcW = cw;
  if (srcH > ch) srcH = ch;
  const sx = Math.max(0, (cw - srcW) / 2);
  const sy = Math.max(0, (ch - srcH) / 2);

  inst.ctx.clearRect(0, 0, dw, dh);
  if (inst.opacityMul < 1) inst.ctx.globalAlpha = inst.opacityMul;
  inst.ctx.drawImage(src, sx, sy, srcW, srcH, 0, 0, dw, dh);
  if (inst.opacityMul < 1) inst.ctx.globalAlpha = 1;

  punchInnerHole(inst);
  if (inst.onFirstCopy) {
    const cb = inst.onFirstCopy;
    inst.onFirstCopy = undefined;
    cb();
  }
  inst.onAfterFrame?.();
}

let lastFrameMs = 0;

function tick(now: number): void {
  if (!SHARED) return;
  if (SHARED.contextLost) {
    SHARED.rafId = 0;
    return;
  }

  // Loop stays alive while at least one visible instance still has work to do
  // — i.e. it's either unpaused (needs a fresh copy each frame) or paused but
  // hasn't yet painted its first frame (initial-mount-paused case).
  let anyWork = false;
  for (const inst of SHARED.instances) {
    if (inst.visible && (!inst.paused || !inst.everCopied)) {
      anyWork = true;
      break;
    }
  }
  if (!anyWork) {
    SHARED.rafId = 0;
    return;
  }

  SHARED.rafId = requestAnimationFrame(tick);
  if (now - lastFrameMs < FRAME_INTERVAL_MS) return;
  lastFrameMs = now;

  const glowPlan = _glowCallback ? planGlowUpdates(SHARED.glowQueue, SHARED.glowIdx, now) : null;
  const glowTargets = new Set(glowPlan?.instances ?? []);
  if (glowPlan) SHARED.glowIdx = glowPlan.nextIndex;

  for (const group of planRenderGroups(SHARED.instances)) {
    renderSharedFrame(now, group.mode, group.finish, group.lightX, group.lightY, group.lightIntensity, group.press);
    for (const glowTarget of glowTargets) {
      if (group.instances.includes(glowTarget)) ensureGlowPixels(glowTarget);
    }
    let frame: CanvasImageSource = SHARED.glCanvas;
    if (SHARED.useOffscreen) frame = (SHARED.glCanvas as OffscreenCanvas).transferToImageBitmap();
    for (const inst of group.instances) {
      copyShaderToInstance(inst, frame);
      inst.everCopied = true;
    }
    if (frame instanceof ImageBitmap) frame.close();
  }

  for (const glowTarget of glowTargets) _glowCallback?.(glowTarget, now);
}

function startSharedLoop(): void {
  const shared = SHARED;
  if (shared?.rafId !== 0 || shared.contextLost) return;
  shared.rafId = requestAnimationFrame(tick);
}

function stopSharedLoop(): void {
  if (!SHARED) return;
  if (SHARED.rafId !== 0) cancelAnimationFrame(SHARED.rafId);
  SHARED.rafId = 0;
}
