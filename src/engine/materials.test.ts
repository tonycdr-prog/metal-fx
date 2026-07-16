import { describe, expect, it } from 'vitest';
import { FINISHES } from './finishes';
import { isMetalFxMaterialName, MATERIALS, type MetalFxMaterial, resolveMaterial } from './materials';
import { PRESETS } from './presets';

describe('MATERIALS registry', () => {
  it('ships the six tier-1 tokens from RFC 0001', () => {
    expect(Object.keys(MATERIALS).sort()).toEqual([
      'brushed-metal',
      'copper',
      'holographic',
      'mercury',
      'molten-chrome',
      'obsidian'
    ]);
  });

  it('holds only valid, JSON-serializable renderer axes', () => {
    for (const [name, material] of Object.entries(MATERIALS)) {
      expect(PRESETS[material.preset], `${name} preset`).toBeDefined();
      expect(FINISHES[material.finish], `${name} finish`).toBeDefined();
      expect(material.strength, `${name} strength`).toBeGreaterThanOrEqual(0);
      expect(material.strength, `${name} strength`).toBeLessThanOrEqual(1);
      expect(JSON.parse(JSON.stringify(material))).toEqual(material);
    }
  });

  it('never pins theme on a registry token (RFC 0001 resolution 1)', () => {
    for (const material of Object.values(MATERIALS)) {
      expect('theme' in material).toBe(false);
    }
  });

  it('contains no two tokens with identical renderer state', () => {
    const materials: MetalFxMaterial[] = Object.values(MATERIALS);
    const signatures = materials.map((m) =>
      JSON.stringify([m.preset, m.finish, m.strength, m.scale ?? 1, m.theme ?? 'adaptive'])
    );
    expect(new Set(signatures).size).toBe(signatures.length);
  });
});

describe('resolveMaterial', () => {
  it('resolves known names via the registry', () => {
    expect(resolveMaterial('obsidian')).toBe(MATERIALS.obsidian);
    expect(isMetalFxMaterialName('obsidian')).toBe(true);
  });

  it('passes inline material objects through untouched', () => {
    const inline = { preset: 'gold', finish: 'brushed', strength: 0.5 } as const;
    expect(resolveMaterial(inline)).toBe(inline);
  });

  it('resolves unknown runtime names and empty references to null', () => {
    expect(resolveMaterial('not-a-material' as never)).toBeNull();
    expect(isMetalFxMaterialName('not-a-material')).toBe(false);
    expect(resolveMaterial(undefined)).toBeNull();
    expect(resolveMaterial(null)).toBeNull();
  });
});
