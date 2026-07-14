import type { MetalFxPreset, MetalFxTheme } from '../../src';
import type { MaterialLabEnvironment } from './environments';
import type { InteractionMode } from './useInteractionSignal';

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
  fixture: MaterialLabFixture;
  interaction: InteractionMode;
  paused: boolean;
  preset: MetalFxPreset;
  preview: MaterialLabPreview;
  recipe: MaterialLabRecipeId;
  strength: number;
  theme: MaterialLabTheme;
}

export interface MaterialLabRecipe {
  description: string;
  id: MaterialLabRecipeId;
  label: string;
  presentation: {
    backdrop: string;
    content: string;
    surface: string;
  };
  state: Omit<MaterialLabState, 'recipe'>;
}
