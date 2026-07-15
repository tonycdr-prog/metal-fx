import type { FinishName } from './finishes';
import type { PresetName } from './presets';

/**
 * A material token: the renderer-affecting description of a metal-fx surface.
 * Plain JSON-serializable data — no functions, no refs — so design tooling,
 * documentation, and non-React consumers can share the same vocabulary.
 * Geometry (variant, shaderScale, ringCssPx) and behaviour (interactive,
 * paused, reflections) are properties of where a material is used, not of
 * the material itself, and are deliberately excluded. See RFC 0001.
 */
export interface MetalFxMaterial {
  /** Color tuning. */
  preset: PresetName;
  /** Physical surface response. */
  finish: FinishName;
  /** Rendered alpha of ring + glow, canonical unit 0..1. */
  strength: number;
  /** Master pixel-scale multiplier. Omitted = 1. */
  scale?: number;
  /**
   * Optional theme pin. Omitted (the default for every registry token) =
   * adapt to the host app's mode; presets ship dark and light tunings.
   */
  theme?: 'dark' | 'light';
}

/**
 * Curated tier-1 materials (RFC 0001). Adding a token is a minor release;
 * removing or renaming one is a major release; visibly changing one requires
 * a visual-baseline update and changelog entry in the same PR.
 */
export const MATERIALS = {
  'molten-chrome': { preset: 'chromatic', finish: 'molten', strength: 1 },
  'brushed-metal': { preset: 'silver', finish: 'brushed', strength: 0.76 },
  mercury: { preset: 'silver', finish: 'polished', strength: 0.94 },
  holographic: { preset: 'chromatic', finish: 'holographic', strength: 0.92 },
  copper: { preset: 'gold', finish: 'brushed', strength: 0.88 },
  obsidian: { preset: 'silver', finish: 'polished', strength: 0.66 }
} as const satisfies Record<string, MetalFxMaterial>;

/** Name of a curated material token. */
export type MetalFxMaterialName = keyof typeof MATERIALS;

export function isMetalFxMaterialName(name: string): name is MetalFxMaterialName {
  return Object.keys(MATERIALS).includes(name);
}

/**
 * Resolve a material reference to its token data. Objects pass through
 * untouched; known names resolve via the registry; unknown names resolve to
 * null so callers fall back to their defaults (typos are caught at compile
 * time by the MetalFxMaterialName union — runtime strings from URLs or CMS
 * content degrade to the default look rather than throwing mid-render).
 */
export function resolveMaterial(
  material: MetalFxMaterialName | MetalFxMaterial | null | undefined
): MetalFxMaterial | null {
  if (material == null) return null;
  if (typeof material === 'string') return isMetalFxMaterialName(material) ? MATERIALS[material] : null;
  return material;
}
