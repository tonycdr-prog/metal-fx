import { useCallback, useEffect, useState } from 'react';
import { findMaterialEnvironment } from '../../material-lab/environments';
import { findMaterialRecipe } from '../../material-lab/recipes';
import { buildMaterialLabSearch, readMaterialLabState } from '../../material-lab/state';
import type { MaterialLabState } from '../../material-lab/types';
import { usePageVisible } from '../../material-lab/usePageVisible';
import { useReducedMotion } from '../../material-lab/useReducedMotion';
import './material-lab.css';
import { MaterialLabControls } from './MaterialLabControls';
import { MaterialLabPreview } from './MaterialLabPreview';
import { MaterialRecipePicker } from './MaterialRecipePicker';

export function MaterialLab() {
  const [state, setState] = useState(() => readMaterialLabState(window.location.search));
  const [fallback, setFallback] = useState(false);
  const handleFallbackChange = useCallback((next: boolean) => setFallback(next), []);
  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisible();
  const recipe = findMaterialRecipe(state.recipe);
  const environment = findMaterialEnvironment(state.environment);

  const updateState = (patch: Partial<MaterialLabState>) => {
    setState((current) => ({ ...current, ...patch }));
  };
  const selectRecipe = (id: MaterialLabState['recipe']) => {
    const nextRecipe = findMaterialRecipe(id);
    updateState({ ...nextRecipe.state, recipe: nextRecipe.id });
  };

  useEffect(() => {
    window.history.replaceState(null, '', buildMaterialLabSearch(state));
  }, [state]);

  return (
    <main className="material-lab" aria-labelledby="material-lab-title">
      <header className="material-lab-heading">
        <div className="material-lab-topbar">
          <a className="material-lab-home" href="./">
            <span aria-hidden="true" className="material-lab-mark" />
            Metal FX
          </a>
          <span>Experimental showcase</span>
        </div>
        <div className="material-lab-intro">
          <p>Material Lab</p>
          <h1 id="material-lab-title">Explore the finish.</h1>
          <span>Compare colour, light and motion using the public MetalFx API.</span>
        </div>
      </header>
      <MaterialRecipePicker onSelect={selectRecipe} selected={state.recipe} />
      <div className="material-lab-workspace">
        <MaterialLabPreview
          environment={environment}
          onFallbackChange={handleFallbackChange}
          pageVisible={pageVisible}
          recipe={recipe}
          reducedMotion={reducedMotion}
          state={state}
        />
        <MaterialLabControls fallback={fallback} onChange={updateState} state={state} />
      </div>
    </main>
  );
}
