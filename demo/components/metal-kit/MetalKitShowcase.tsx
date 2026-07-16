import { useState } from 'react';
import type { MetalFxMaterialName } from '../../../src';
import { MetalButton } from './MetalButton';
import { MetalCard, MetalCardEyebrow, MetalCardTitle } from './MetalCard';
import { MetalIconButton } from './MetalIconButton';
import './metal-kit-showcase.css';

const BUTTON_MATERIALS: MetalFxMaterialName[] = ['mercury', 'molten-chrome', 'copper', 'holographic'];

/** Deep-linked prototype gallery for the metal-kit hero components (?metal-kit=1). */
export function MetalKitShowcase() {
  const [activations, setActivations] = useState(0);
  const activate = () => setActivations((count) => count + 1);

  return (
    <main className="metal-kit" aria-labelledby="metal-kit-title">
      <header className="metal-kit-heading">
        <div className="metal-kit-topbar">
          <a className="metal-kit-home" href="./">
            Metal FX
          </a>
          <span>Component prototype</span>
        </div>
        <p>Metal Kit</p>
        <h1 id="metal-kit-title">Hero components.</h1>
        <span>
          Three controls built on the public MetalFx API and the material token registry. Native semantics, responsive
          lighting, honest reduced-motion behavior.
        </span>
      </header>

      <section aria-label="Metal buttons">
        <h2>MetalButton</h2>
        <p className="metal-kit-note">
          One per material token, md size. Hover brightens the rim, press peaks it, keyboard works throughout.
        </p>
        <div className="metal-kit-row">
          {BUTTON_MATERIALS.map((material) => (
            <MetalButton theme="dark" key={material} material={material} onClick={activate}>
              {material}
            </MetalButton>
          ))}
        </div>
        <h3>Sizes and states</h3>
        <div className="metal-kit-row">
          <MetalButton theme="dark" size="sm" onClick={activate}>
            Small
          </MetalButton>
          <MetalButton theme="dark" size="md" onClick={activate}>
            Medium
          </MetalButton>
          <MetalButton theme="dark" size="lg" onClick={activate}>
            Large
          </MetalButton>
          <MetalButton theme="dark" disabled>
            Disabled
          </MetalButton>
        </div>
        <span aria-live="polite" className="metal-kit-counter" data-testid="kit-activations">
          Activated {activations} {activations === 1 ? 'time' : 'times'}
        </span>
      </section>

      <section aria-label="Metal icon buttons">
        <h2>MetalIconButton</h2>
        <p className="metal-kit-note">Circle variant; aria-label is required by the type, so it cannot ship unnamed.</p>
        <div className="metal-kit-row">
          <MetalIconButton theme="dark" aria-label="Send message" size="sm" material="copper" onClick={activate}>
            ↑
          </MetalIconButton>
          <MetalIconButton theme="dark" aria-label="Send message" size="md" material="mercury" onClick={activate}>
            ↑
          </MetalIconButton>
          <MetalIconButton theme="dark" aria-label="Send message" size="lg" material="molten-chrome" onClick={activate}>
            ↑
          </MetalIconButton>
          <MetalIconButton theme="dark" aria-label="Send message" disabled>
            ↑
          </MetalIconButton>
        </div>
      </section>

      <section aria-label="Metal cards">
        <h2>MetalCard</h2>
        <p className="metal-kit-note">
          Static frame by default (obsidian). The right card opts into responsive lighting for hero placements.
        </p>
        <div className="metal-kit-row metal-kit-cards">
          <MetalCard theme="dark">
            <MetalCardEyebrow>Workspace plan</MetalCardEyebrow>
            <MetalCardTitle>Upgrade to Pro</MetalCardTitle>
            <span>Quiet frame for content that should not compete with its copy.</span>
          </MetalCard>
          <MetalCard theme="dark" interactive material="copper">
            <MetalCardEyebrow>Hero placement</MetalCardEyebrow>
            <MetalCardTitle>Responsive lighting</MetalCardTitle>
            <span>Move the pointer across the frame — the material answers, the card never moves.</span>
          </MetalCard>
        </div>
      </section>
    </main>
  );
}
