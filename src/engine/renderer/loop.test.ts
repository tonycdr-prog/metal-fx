import { describe, expect, it } from 'vitest';
import type { MetalFxInstance } from './core';
import { updateInstance } from './loop';

function instance(): MetalFxInstance {
  return {
    kind: 'pill',
    ringCssPx: 1,
    scale: 1,
    shaderScale: 1.6
  } as MetalFxInstance;
}

describe('updateInstance scale', () => {
  it('recomputes default shader sampling and ring thickness for 1 → 2 → 0.5', () => {
    const metal = instance();

    updateInstance(metal, { scale: 2 });
    expect(metal).toMatchObject({ scale: 2, shaderScale: 3.2, ringCssPx: 2 });

    updateInstance(metal, { scale: 0.5 });
    expect(metal).toMatchObject({ scale: 0.5, shaderScale: 0.8, ringCssPx: 0.5 });
  });

  it('preserves explicit overrides while remaining defaults follow scale', () => {
    const metal = instance();

    updateInstance(metal, { scale: 2, shaderScale: 5 });
    expect(metal).toMatchObject({ scale: 2, shaderScale: 5, ringCssPx: 2 });

    updateInstance(metal, { scale: 0.5, ringCssPx: 4 });
    expect(metal).toMatchObject({ scale: 0.5, shaderScale: 0.8, ringCssPx: 4 });
  });
});
