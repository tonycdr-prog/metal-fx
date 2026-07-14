import type { MetalFxPreset, MetalFxTheme } from '../../src';

export type MaterialLabFixture = 'foundation';
export type MaterialLabPreview = 'pill' | 'circle' | 'content';
export type MaterialLabTheme = Exclude<MetalFxTheme, 'auto'>;

export interface MaterialLabState {
  fixture: MaterialLabFixture;
  paused: boolean;
  preset: MetalFxPreset;
  preview: MaterialLabPreview;
  strength: number;
  theme: MaterialLabTheme;
}

export interface MaterialLabRecipe {
  description: string;
  id: MaterialLabFixture;
  label: string;
  state: MaterialLabState;
}
