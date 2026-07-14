import type { MaterialLabRecipe } from './types';

/** The sole foundation recipe keeps the shell data-driven before the catalogue lands. */
export const FOUNDATION_RECIPE: MaterialLabRecipe = {
  id: 'foundation',
  label: 'Foundation fixture',
  description: 'A stable, supported MetalFx configuration for reviewing the lab surface.',
  state: {
    fixture: 'foundation',
    preview: 'pill',
    preset: 'chromatic',
    theme: 'dark',
    strength: 90,
    paused: false
  }
};
