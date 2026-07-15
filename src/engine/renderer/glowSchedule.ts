/** Bounded, elapsed-time-aware round-robin planning for SVG glow updates. */
import { GLOW_MAX_UPDATES_PER_FRAME, GLOW_UPDATE_INTERVAL_MS } from '../perfConfig';
import type { MetalFxInstance } from './core';

export interface GlowUpdatePlan {
  instances: MetalFxInstance[];
  nextIndex: number;
}

export function planGlowUpdates(queue: MetalFxInstance[], startIndex: number, now: number): GlowUpdatePlan {
  if (queue.length === 0) return { instances: [], nextIndex: 0 };
  let index = startIndex >= queue.length ? 0 : startIndex;
  let examined = 0;
  const instances: MetalFxInstance[] = [];

  while (examined < queue.length && instances.length < GLOW_MAX_UPDATES_PER_FRAME) {
    const candidate = queue[index];
    index = (index + 1) % queue.length;
    examined++;
    if (!candidate.visible || candidate.paused) continue;
    if (now - candidate.glowUpdateMs < GLOW_UPDATE_INTERVAL_MS) continue;
    candidate.glowUpdateMs = now;
    instances.push(candidate);
  }

  return { instances, nextIndex: index };
}
