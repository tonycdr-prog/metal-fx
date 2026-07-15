import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MATERIALS } from '../../../src';
import { MetalButton } from './MetalButton';
import { MetalCard } from './MetalCard';
import { MetalIconButton } from './MetalIconButton';

describe('metal-kit components', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it('renders a native button that activates and carries the material token', () => {
    const onClick = vi.fn();
    act(() => root.render(<MetalButton onClick={onClick}>Upgrade</MetalButton>));

    const button = container.querySelector('button');
    expect(button?.type).toBe('button');
    button?.click();
    expect(onClick).toHaveBeenCalledOnce();

    const wrapper = container.querySelector<HTMLElement>('.metal-fx-root');
    expect(wrapper?.dataset.finish).toBe(MATERIALS.mercury.finish);
    expect(wrapper?.dataset.interactive).toBe('true');
  });

  it('mutes and inertizes the disabled state', () => {
    const onClick = vi.fn();
    act(() =>
      root.render(
        <MetalButton disabled onClick={onClick}>
          Disabled
        </MetalButton>
      )
    );

    const button = container.querySelector('button');
    button?.click();
    expect(onClick).not.toHaveBeenCalled();
    expect(button?.disabled).toBe(true);

    const wrapper = container.querySelector<HTMLElement>('.metal-fx-root');
    expect(wrapper?.dataset.interactive).toBeUndefined();
    const strength = Number(wrapper?.style.getPropertyValue('--mfx-strength'));
    expect(strength).toBeLessThan(MATERIALS.mercury.strength * 0.5);
    expect(container.querySelector('.metal-fx-glow-svg')).toBeNull();
  });

  it('lifts strength on keyboard press and releases on blur', () => {
    act(() => root.render(<MetalButton material="copper">Press me</MetalButton>));
    const button = container.querySelector('button') as HTMLButtonElement;
    const wrapper = container.querySelector<HTMLElement>('.metal-fx-root') as HTMLElement;
    const strengthOf = () => Number(wrapper.style.getPropertyValue('--mfx-strength'));

    const idle = strengthOf();
    act(() => button.focus());
    act(() => {
      button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    });
    expect(strengthOf()).toBeCloseTo(MATERIALS.copper.strength, 5);
    expect(strengthOf()).toBeGreaterThan(idle);

    act(() => button.blur());
    expect(strengthOf()).toBeCloseTo(idle, 5);
  });

  it('renders the circle variant for icon buttons with a required name', () => {
    act(() =>
      root.render(
        <MetalIconButton aria-label="Send" material="molten-chrome">
          ↑
        </MetalIconButton>
      )
    );
    expect(container.querySelector('button')?.getAttribute('aria-label')).toBe('Send');
    expect(container.querySelector<HTMLElement>('.metal-fx-root')?.dataset.variant).toBe('circle');
  });

  it('keeps cards static by default and interactive on opt-in', () => {
    act(() =>
      root.render(
        <>
          <MetalCard data-testid="quiet">quiet</MetalCard>
          <MetalCard data-testid="hero" interactive>
            hero
          </MetalCard>
        </>
      )
    );
    const wrappers = container.querySelectorAll<HTMLElement>('.metal-fx-root');
    expect(wrappers[0].dataset.interactive).toBeUndefined();
    expect(wrappers[1].dataset.interactive).toBe('true');
  });
});
