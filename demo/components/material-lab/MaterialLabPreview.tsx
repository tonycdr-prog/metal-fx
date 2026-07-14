import { MetalFx } from '../../../src';
import type { MaterialLabRecipe, MaterialLabState } from '../../material-lab/types';

interface MaterialLabPreviewProps {
  recipe: MaterialLabRecipe;
  reducedMotion: boolean;
  state: MaterialLabState;
}

function PreviewContent({ preview }: Pick<MaterialLabState, 'preview'>) {
  if (preview === 'circle') {
    return (
      <button aria-label="Material Lab circle action" className="material-lab-circle" type="button">
        +
      </button>
    );
  }
  if (preview === 'content') {
    return (
      <article className="material-lab-content-card">
        <span>Experimental surface</span>
        <strong>Review the treatment in context.</strong>
      </article>
    );
  }
  return (
    <button className="material-lab-pill" type="button">
      Material sample
    </button>
  );
}

export function MaterialLabPreview({ recipe, reducedMotion, state }: MaterialLabPreviewProps) {
  const isPaused = reducedMotion || state.paused;
  return (
    <section
      className={`material-lab-preview material-lab-preview-${state.theme}`}
      aria-label="Live Material Lab preview"
      style={{ background: recipe.presentation.backdrop, color: recipe.presentation.content }}
    >
      <div className="material-lab-preview-meta">
        <span>Live preview</span>
        <span>{reducedMotion ? 'Reduced motion: static' : isPaused ? 'Motion paused' : 'Motion active'}</span>
      </div>
      <div className="material-lab-stage" style={{ background: recipe.presentation.surface }}>
        <MetalFx
          disableGlow={reducedMotion}
          paused={isPaused}
          preset={state.preset}
          theme={state.theme}
          variant={state.preview === 'circle' ? 'circle' : 'button'}
          strength={state.strength / 100}
        >
          <PreviewContent preview={state.preview} />
        </MetalFx>
      </div>
      <p>
        Native MetalFx: preset, theme, strength, shape, and pause state. This recipe's stage and content are demo
        presentation.
      </p>
    </section>
  );
}
