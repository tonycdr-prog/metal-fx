import { FOUNDATION_RECIPE } from './recipes';
import type { MaterialLabPreview, MaterialLabState, MaterialLabTheme } from './types';

const PRESETS = new Set(['chromatic', 'silver', 'gold']);
const PREVIEWS = new Set<MaterialLabPreview>(['pill', 'circle', 'content']);
const THEMES = new Set<MaterialLabTheme>(['dark', 'light']);

function clampStrength(value: string | null): number {
  if (value === null) return FOUNDATION_RECIPE.state.strength;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return FOUNDATION_RECIPE.state.strength;
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

  return {
    fixture: 'foundation',
    preview: PREVIEWS.has(preview as MaterialLabPreview)
      ? (preview as MaterialLabPreview)
      : FOUNDATION_RECIPE.state.preview,
    preset: PRESETS.has(preset ?? '') ? (preset as MaterialLabState['preset']) : FOUNDATION_RECIPE.state.preset,
    theme: THEMES.has(theme as MaterialLabTheme) ? (theme as MaterialLabTheme) : FOUNDATION_RECIPE.state.theme,
    strength: clampStrength(params.get('strength')),
    paused: params.get('paused') === '1'
  };
}

export function buildMaterialLabSearch(state: MaterialLabState, search = window.location.search): string {
  const params = new URLSearchParams(search);
  params.set('material-lab', '1');
  params.set('fixture', state.fixture);
  params.set('preview', state.preview);
  params.set('preset', state.preset);
  params.set('theme', state.theme);
  params.set('strength', String(state.strength));
  params.set('paused', state.paused ? '1' : '0');
  return `?${params.toString()}`;
}
