import { findMaterialRecipe } from './recipes';
import type { MaterialLabPreview, MaterialLabState, MaterialLabTheme } from './types';

const PRESETS = new Set(['chromatic', 'silver', 'gold']);
const PREVIEWS = new Set<MaterialLabPreview>(['pill', 'circle', 'content']);
const THEMES = new Set<MaterialLabTheme>(['dark', 'light']);

function clampStrength(value: string | null, fallback: number): number {
  if (value === null || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.round(Math.min(100, Math.max(0, parsed)));
}

export function isMaterialLabRequested(search: string): boolean {
  return new URLSearchParams(search).get('material-lab') === '1';
}

export function readMaterialLabState(search: string): MaterialLabState {
  const params = new URLSearchParams(search);
  const preview = params.get('preview');
  const preset = params.get('preset');
  const theme = params.get('theme');
  const recipe = findMaterialRecipe(params.get('recipe'));

  return {
    ...recipe.state,
    recipe: recipe.id,
    preview: PREVIEWS.has(preview as MaterialLabPreview) ? (preview as MaterialLabPreview) : recipe.state.preview,
    preset: PRESETS.has(preset ?? '') ? (preset as MaterialLabState['preset']) : recipe.state.preset,
    theme: THEMES.has(theme as MaterialLabTheme) ? (theme as MaterialLabTheme) : recipe.state.theme,
    strength: clampStrength(params.get('strength'), recipe.state.strength),
    paused: params.get('paused') === '1'
  };
}

export function buildMaterialLabSearch(state: MaterialLabState, search = window.location.search): string {
  const params = new URLSearchParams(search);
  params.set('material-lab', '1');
  params.set('fixture', state.fixture);
  params.set('recipe', state.recipe);
  params.set('preview', state.preview);
  params.set('preset', state.preset);
  params.set('theme', state.theme);
  params.set('strength', String(state.strength));
  params.set('paused', state.paused ? '1' : '0');
  return `?${params.toString()}`;
}
