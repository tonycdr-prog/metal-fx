import type { MetalFxPreset } from '../../../src';
import { MATERIAL_ENVIRONMENTS } from '../../material-lab/environments';
import type { MaterialLabPreview, MaterialLabState, MaterialLabTheme } from '../../material-lab/types';
import './material-lab-controls.css';

const PREVIEWS: { label: string; value: MaterialLabPreview }[] = [
  { label: 'Pill', value: 'pill' },
  { label: 'Circle', value: 'circle' },
  { label: 'Content', value: 'content' }
];

const PRESETS: MetalFxPreset[] = ['chromatic', 'silver', 'gold'];
const THEMES: MaterialLabTheme[] = ['dark', 'light'];

interface MaterialLabControlsProps {
  onChange: (patch: Partial<MaterialLabState>) => void;
  state: MaterialLabState;
}

export function MaterialLabControls({ onChange, state }: MaterialLabControlsProps) {
  return (
    <form className="material-lab-controls" aria-label="Material Lab controls">
      <header>
        <strong>Configuration</strong>
        <span>Every change is saved in the URL.</span>
      </header>
      <fieldset>
        <legend>Shape</legend>
        <div className="material-lab-segmented">
          {PREVIEWS.map(({ label, value }) => (
            <button
              aria-pressed={state.preview === value}
              key={value}
              onClick={() => onChange({ preview: value })}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <label>
        Preset
        <select onChange={(event) => onChange({ preset: event.target.value as MetalFxPreset })} value={state.preset}>
          {PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {preset[0].toUpperCase() + preset.slice(1)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Environment
        <select
          onChange={(event) => onChange({ environment: event.target.value as MaterialLabState['environment'] })}
          value={state.environment}
        >
          {MATERIAL_ENVIRONMENTS.map((environment) => (
            <option key={environment.id} value={environment.id}>
              {environment.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Theme
        <select onChange={(event) => onChange({ theme: event.target.value as MaterialLabTheme })} value={state.theme}>
          {THEMES.map((theme) => (
            <option key={theme} value={theme}>
              {theme[0].toUpperCase() + theme.slice(1)}
            </option>
          ))}
        </select>
      </label>

      <div className="material-lab-strength">
        <label htmlFor="material-lab-strength">Strength</label>
        <output htmlFor="material-lab-strength">{state.strength}%</output>
        <input
          id="material-lab-strength"
          max="100"
          min="0"
          onChange={(event) => onChange({ strength: Number(event.target.value) })}
          step="1"
          type="range"
          value={state.strength}
        />
      </div>

      <button
        aria-pressed={state.paused}
        className="material-lab-motion-toggle"
        onClick={() => onChange({ paused: !state.paused })}
        type="button"
      >
        {state.paused ? 'Resume preview motion' : 'Pause preview motion'}
      </button>
    </form>
  );
}
