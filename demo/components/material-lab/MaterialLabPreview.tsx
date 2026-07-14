import { useMemo, useRef } from 'react';
import { MetalFx } from '../../../src';
import type { MaterialLabEnvironment } from '../../material-lab/environments';
import type { MaterialLabRecipe, MaterialLabState } from '../../material-lab/types';
import './material-lab-preview.css';

interface MaterialLabPreviewProps {
  environment: { animated: boolean; id: MaterialLabEnvironment; label: string; surface: string };
  pageVisible: boolean;
  recipe: MaterialLabRecipe;
  reducedMotion: boolean;
  state: MaterialLabState;
}

function PreviewContent({ preview }: Pick<MaterialLabState, 'preview'>) {
  if (preview === 'circle') {
    return (
      <button aria-label="Send" className="material-lab-circle" type="button">
        ↑
      </button>
    );
  }
  if (preview === 'content') {
    return (
      <button className="material-lab-content-card" type="button">
        <span>Workspace plan</span>
        <strong>Upgrade to Pro</strong>
      </button>
    );
  }
  return (
    <button className="material-lab-pill" type="button">
      Upgrade to Pro
    </button>
  );
}

export function MaterialLabPreview({
  environment,
  pageVisible,
  recipe,
  reducedMotion,
  state
}: MaterialLabPreviewProps) {
  const isPaused = reducedMotion || state.paused;
  const reflectionTarget = useRef<HTMLElement>(null);
  const reflectionTargets = useMemo(() => [reflectionTarget], []);
  const animateEnvironment = environment.animated && pageVisible && !reducedMotion && !isPaused;
  return (
    <section
      className={`material-lab-preview material-lab-preview-${state.theme}`}
      aria-label="Live Material Lab preview"
      style={{ background: recipe.presentation.backdrop, color: recipe.presentation.content }}
    >
      <div className="material-lab-preview-meta">
        <span>{recipe.label}</span>
        <span>{reducedMotion ? 'Reduced motion: static' : isPaused ? 'Motion paused' : 'Motion active'}</span>
      </div>
      <div
        className={`material-lab-stage ${animateEnvironment ? 'material-lab-environment-moving' : ''}`}
        data-testid="interaction-stage"
        style={{ background: environment.surface }}
      >
        <MetalFx
          disableGlow={reducedMotion}
          paused={isPaused}
          preset={state.preset}
          reflectionTargets={state.theme === 'dark' ? reflectionTargets : undefined}
          theme={state.theme}
          variant={state.preview === 'circle' ? 'circle' : 'button'}
          strength={state.strength / 100}
        >
          <PreviewContent preview={state.preview} />
        </MetalFx>
        <aside
          aria-label="Supported reflection target"
          className="material-lab-reflection-target"
          ref={reflectionTarget}
        >
          Nearby surface
        </aside>
      </div>
      <footer className="material-lab-preview-details">
        <p>{recipe.description}</p>
        <div>
          <span>{state.preset}</span>
          <span>{environment.label}</span>
          <span>{state.strength}%</span>
        </div>
      </footer>
    </section>
  );
}
