import { useRef, useState } from 'react';
import { MetalFx } from '../../../src';
import type { MaterialLabEnvironment } from '../../material-lab/environments';
import type { MaterialLabRecipe, MaterialLabState } from '../../material-lab/types';
import { useInteractionSignal } from '../../material-lab/useInteractionSignal';

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
      <button aria-label="Material Lab circle action" className="material-lab-circle" type="button">
        +
      </button>
    );
  }
  if (preview === 'content') {
    return (
      <button className="material-lab-content-card" type="button">
        <span>Experimental surface</span>
        <strong>Review the treatment in context.</strong>
      </button>
    );
  }
  return (
    <button className="material-lab-pill" type="button">
      Material sample
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
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const reflectionTarget = useRef<HTMLElement>(null);
  const signal = useInteractionSignal(state.interaction, reducedMotion, stage);
  const breathing = state.interaction === 'idle-breathing' && !isPaused;
  const animateEnvironment = environment.animated && pageVisible && !reducedMotion && !isPaused;
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
      <div
        className={`material-lab-stage ${breathing ? 'material-lab-stage-breathing' : ''} ${animateEnvironment ? 'material-lab-environment-moving' : ''}`}
        data-interaction-mode={state.interaction}
        data-interaction-signal={signal.toFixed(2)}
        data-testid="interaction-stage"
        ref={setStage}
        style={{ background: environment.surface, transform: `translateX(${signal * 8}px)` }}
      >
        <MetalFx
          disableGlow={reducedMotion}
          paused={isPaused}
          preset={state.preset}
          reflectionTargets={state.theme === 'dark' ? [reflectionTarget] : undefined}
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
          Reflection target
        </aside>
      </div>
      <p>
        Native MetalFx: preset, theme, strength, shape, pause state, and the nearby reflection target. The environment
        and interactions are demo presentation.
      </p>
    </section>
  );
}
