import { useEffect, useState } from 'react';
import { FOUNDATION_RECIPE } from '../../material-lab/recipes';
import { buildMaterialLabSearch, readMaterialLabState } from '../../material-lab/state';
import type { MaterialLabState } from '../../material-lab/types';
import { useReducedMotion } from '../../material-lab/useReducedMotion';
import './material-lab.css';
import { MaterialLabControls } from './MaterialLabControls';
import { MaterialLabPreview } from './MaterialLabPreview';

export function MaterialLab() {
  const [state, setState] = useState(() => readMaterialLabState(window.location.search));
  const reducedMotion = useReducedMotion();

  const updateState = (patch: Partial<MaterialLabState>) => {
    setState((current) => ({ ...current, ...patch }));
  };

  useEffect(() => {
    window.history.replaceState(null, '', buildMaterialLabSearch(state));
  }, [state]);

  return (
    <main className="material-lab" aria-labelledby="material-lab-title">
      <header className="material-lab-heading">
        <p>Experimental / Material Lab</p>
        <h1 id="material-lab-title">A single surface for honest treatment studies.</h1>
        <span>{FOUNDATION_RECIPE.description}</span>
      </header>
      <div className="material-lab-workspace">
        <MaterialLabPreview reducedMotion={reducedMotion} state={state} />
        <MaterialLabControls onChange={updateState} state={state} />
      </div>
    </main>
  );
}
