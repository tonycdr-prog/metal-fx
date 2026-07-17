import type { MetalFxFinish, MetalFxPreset, MetalFxTheme } from '../../src';
import type { MaterialLabEnvironment } from './environments';

export type MaterialLabFixture = 'foundation';
export type MaterialLabPreview = 'pill' | 'circle' | 'content';
export type MaterialLabRecipeId =
  | 'molten-chrome'
  | 'brushed-metal'
  | 'mercury'
  | 'holographic'
  | 'copper'
  | 'obsidian'
  | 'electric-plasma';
export type MaterialLabTheme = Exclude<MetalFxTheme, 'auto'>;

export interface MaterialLabState {
  environment: MaterialLabEnvironment;
  finish: MetalFxFinish;
  fixture: MaterialLabFixture;
  interactive: boolean;
  paused: boolean;
  preset: MetalFxPreset;
  preview: MaterialLabPreview;
  recipe: MaterialLabRecipeId;
  strength: number;
  theme: MaterialLabTheme;
  /** Material inspection scale (1 | 1.5 | 2). Not part of a recipe: it is a
   *  viewing tool that survives treatment switches. */
  zoom: MaterialLabZoom;
}

export type MaterialLabZoom = 1 | 1.5 | 2;

export interface MaterialLabRecipe {
  description: string;
  id: MaterialLabRecipeId;
  label: string;
  presentation: {
    backdrop: string;
    content: string;
    surface: string;
  };
  state: Omit<MaterialLabState, 'recipe' | 'zoom'>;
}
