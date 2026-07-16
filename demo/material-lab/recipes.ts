import { MATERIALS, type MetalFxMaterial, type MetalFxMaterialName } from '../../src';
import type { MaterialLabRecipe, MaterialLabRecipeId, MaterialLabState } from './types';

/** Lab state derived from a registry token: material axes come from the
 *  single source of truth in `MATERIALS`; staging (environment, preview,
 *  theme, motion) stays a per-recipe presentation concern. The Lab displays
 *  strength as 0–100, so the canonical 0..1 converts at this boundary. */
function fromMaterial(material: MetalFxMaterial): Pick<MaterialLabState, 'preset' | 'finish' | 'strength'> {
  return { preset: material.preset, finish: material.finish, strength: Math.round(material.strength * 100) };
}

function material(name: MetalFxMaterialName): Pick<MaterialLabState, 'preset' | 'finish' | 'strength'> {
  return fromMaterial(MATERIALS[name]);
}

export const MATERIAL_RECIPES: readonly MaterialLabRecipe[] = [
  {
    id: 'molten-chrome',
    label: 'Molten chrome',
    description: 'Mirror-bright liquid on a furnace-dark stage.',
    presentation: { backdrop: '#1c100b', surface: '#2a1710', content: '#fff1de' },
    state: {
      ...material('molten-chrome'),
      environment: 'studio-sweep',
      fixture: 'foundation',
      interactive: false,
      preview: 'pill',
      theme: 'dark',
      paused: false
    }
  },
  {
    id: 'brushed-metal',
    label: 'Brushed metal',
    description: 'A calm, machined treatment for light editorial surfaces.',
    presentation: { backdrop: '#e6e5e1', surface: '#f5f4ef', content: '#252a2d' },
    state: {
      ...material('brushed-metal'),
      environment: 'studio-sweep',
      fixture: 'foundation',
      interactive: false,
      preview: 'content',
      theme: 'light',
      paused: false
    }
  },
  {
    id: 'mercury',
    label: 'Mercury',
    description: 'Dense silver held in a cool, low-light field.',
    presentation: { backdrop: '#14191e', surface: '#202a32', content: '#e8edf2' },
    state: {
      ...material('mercury'),
      environment: 'studio-sweep',
      fixture: 'foundation',
      interactive: false,
      preview: 'circle',
      theme: 'dark',
      paused: false
    }
  },
  {
    id: 'holographic',
    label: 'Holographic',
    description: 'A chromatic native ring paired with a spectral demo field.',
    presentation: { backdrop: '#151021', surface: '#241934', content: '#f2eaff' },
    state: {
      ...material('holographic'),
      environment: 'spectral-wash',
      fixture: 'foundation',
      interactive: false,
      preview: 'pill',
      theme: 'dark',
      paused: false
    }
  },
  {
    id: 'copper',
    label: 'Copper',
    description: 'Warm gold tuning with oxidised, tactile presentation.',
    presentation: { backdrop: '#21120d', surface: '#3a1c12', content: '#ffe9d0' },
    state: {
      ...material('copper'),
      environment: 'warm-cool-split',
      fixture: 'foundation',
      interactive: false,
      preview: 'content',
      theme: 'dark',
      paused: false
    }
  },
  {
    id: 'obsidian',
    label: 'Obsidian',
    description: 'A restrained silver edge on near-black volcanic glass.',
    presentation: { backdrop: '#0e1011', surface: '#171a1c', content: '#e9e7e0' },
    state: {
      ...material('obsidian'),
      environment: 'dark-tunnel',
      fixture: 'foundation',
      interactive: false,
      preview: 'circle',
      theme: 'dark',
      paused: false
    }
  },
  {
    // Lab-only treatment (RFC 0001 resolution 3): its renderer state is
    // identical to molten-chrome, so it stays out of the MATERIALS registry
    // until a renderer axis differentiates it. The staging is what makes it
    // distinct in the Lab.
    id: 'electric-plasma',
    label: 'Electric plasma',
    description: 'High-energy chromatic metal contained by a deep violet field.',
    presentation: { backdrop: '#111126', surface: '#19183b', content: '#edf0ff' },
    state: {
      ...material('molten-chrome'),
      environment: 'moving-softbox',
      fixture: 'foundation',
      interactive: false,
      preview: 'pill',
      theme: 'dark',
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
