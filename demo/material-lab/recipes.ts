import type { MaterialLabRecipe, MaterialLabRecipeId } from './types';

export const MATERIAL_RECIPES: readonly MaterialLabRecipe[] = [
  {
    id: 'molten-chrome',
    label: 'Molten chrome',
    description: 'Mirror-bright liquid on a furnace-dark stage.',
    presentation: { backdrop: '#1c100b', surface: '#2a1710', content: '#fff1de' },
    state: {
      environment: 'studio-sweep',
      fixture: 'foundation',
      preview: 'pill',
      preset: 'chromatic',
      theme: 'dark',
      strength: 100,
      paused: false
    }
  },
  {
    id: 'brushed-metal',
    label: 'Brushed metal',
    description: 'A calm, machined treatment for light editorial surfaces.',
    presentation: { backdrop: '#e6e5e1', surface: '#f5f4ef', content: '#252a2d' },
    state: {
      environment: 'studio-sweep',
      fixture: 'foundation',
      preview: 'content',
      preset: 'silver',
      theme: 'light',
      strength: 76,
      paused: false
    }
  },
  {
    id: 'mercury',
    label: 'Mercury',
    description: 'Dense silver held in a cool, low-light field.',
    presentation: { backdrop: '#14191e', surface: '#202a32', content: '#e8edf2' },
    state: {
      environment: 'studio-sweep',
      fixture: 'foundation',
      preview: 'circle',
      preset: 'silver',
      theme: 'dark',
      strength: 94,
      paused: false
    }
  },
  {
    id: 'holographic',
    label: 'Holographic',
    description: 'A chromatic native ring paired with a spectral demo field.',
    presentation: { backdrop: '#151021', surface: '#241934', content: '#f2eaff' },
    state: {
      environment: 'spectral-wash',
      fixture: 'foundation',
      preview: 'pill',
      preset: 'chromatic',
      theme: 'dark',
      strength: 92,
      paused: false
    }
  },
  {
    id: 'copper',
    label: 'Copper',
    description: 'Warm gold tuning with oxidised, tactile presentation.',
    presentation: { backdrop: '#21120d', surface: '#3a1c12', content: '#ffe9d0' },
    state: {
      environment: 'warm-cool-split',
      fixture: 'foundation',
      preview: 'content',
      preset: 'gold',
      theme: 'dark',
      strength: 88,
      paused: false
    }
  },
  {
    id: 'obsidian',
    label: 'Obsidian',
    description: 'A restrained silver edge on near-black volcanic glass.',
    presentation: { backdrop: '#0e1011', surface: '#171a1c', content: '#e9e7e0' },
    state: {
      environment: 'dark-tunnel',
      fixture: 'foundation',
      preview: 'circle',
      preset: 'silver',
      theme: 'dark',
      strength: 66,
      paused: false
    }
  },
  {
    id: 'electric-plasma',
    label: 'Electric plasma',
    description: 'High-energy chromatic metal contained by a deep violet field.',
    presentation: { backdrop: '#111126', surface: '#19183b', content: '#edf0ff' },
    state: {
      environment: 'moving-softbox',
      fixture: 'foundation',
      preview: 'pill',
      preset: 'chromatic',
      theme: 'dark',
      strength: 100,
      paused: false
    }
  }
];

export const FOUNDATION_RECIPE = MATERIAL_RECIPES[0];

export function findMaterialRecipe(id: string | null): MaterialLabRecipe {
  return MATERIAL_RECIPES.find((recipe) => recipe.id === id) ?? FOUNDATION_RECIPE;
}

export function isMaterialRecipeId(id: string): id is MaterialLabRecipeId {
  return MATERIAL_RECIPES.some((recipe) => recipe.id === id);
}
