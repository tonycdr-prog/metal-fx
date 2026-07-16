/** Physical surface responses applied independently from color presets. */
export type FinishName = 'polished' | 'brushed' | 'molten' | 'holographic';

export interface FinishProfile {
  name: FinishName;
  /** Directional micro-banding mixed into the scalar metal field. */
  grain: number;
  /** Spatial frequency of the directional micro-banding. */
  grainScale: number;
  /** Low-frequency coordinate flow applied before the plasma field. */
  flow: number;
  /** RGB palette separation around the scalar field. */
  spectral: number;
  /** Finish-local contrast applied before the shared gamma pass. */
  contrast: number;
  /** Multiplier for the preset animation speed. */
  speed: number;
}

export const FINISHES: Record<FinishName, FinishProfile> = {
  polished: {
    name: 'polished',
    grain: 0,
    grainScale: 1,
    flow: 0,
    spectral: 0,
    contrast: 1,
    speed: 1
  },
  brushed: {
    name: 'brushed',
    /* Grain is the identity of this finish, and it has to survive being
       sampled into a 1-2 px ring: stronger banding at a lower spatial
       frequency keeps individual brush lines wider than a device pixel.
       The previous 0.16 / 52 tuning read as polished at ring width. */
    grain: 0.34,
    grainScale: 30,
    flow: 0.03,
    spectral: 0,
    contrast: 0.97,
    speed: 0.42
  },
  molten: {
    name: 'molten',
    grain: 0,
    grainScale: 1,
    flow: 0.52,
    spectral: 0.025,
    contrast: 1.12,
    speed: 0.72
  },
  holographic: {
    name: 'holographic',
    grain: 0.035,
    grainScale: 24,
    flow: 0.18,
    spectral: 0.14,
    contrast: 1.06,
    speed: 0.88
  }
};
