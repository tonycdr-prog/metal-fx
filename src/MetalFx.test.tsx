import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const engine = vi.hoisted(() => ({
  createInstance: vi.fn(),
  destroyInstance: vi.fn(),
  registerGlowInstance: vi.fn(),
  setInstanceVisible: vi.fn(),
  unregisterGlowInstance: vi.fn(),
  updateInstance: vi.fn()
}));

const glow = vi.hoisted(() => ({
  injectGlow: vi.fn((container: HTMLElement) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'metal-fx-glow-svg');
    container.appendChild(svg);
    return { marker: 'glow', svg };
  })
}));

vi.mock('./engine/renderer/loop', () => engine);
vi.mock('./engine/glow/glow', () => glow);
vi.mock('./engine/glow/registry', () => ({ deleteGlowHandles: vi.fn(), setGlowHandles: vi.fn() }));
vi.mock('./engine/reflection/paint', () => ({ addReflectionTarget: vi.fn(), removeReflectionTarget: vi.fn() }));
vi.mock('./engine/reflection/reflectionScheduler', () => ({ scheduleReflectionPaint: vi.fn() }));

import { injectGlow } from './engine/glow/glow';
import { deleteGlowHandles, setGlowHandles } from './engine/glow/registry';
import { addReflectionTarget, removeReflectionTarget } from './engine/reflection/paint';
import { MetalFx } from './MetalFx';

describe('MetalFx', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    engine.createInstance.mockImplementation((options) => {
      options.onFirstCopy?.();
      return {
        cornerRadius: options.cornerRadius,
        cssHeight: options.cssHeight,
        cssWidth: options.cssWidth,
        kind: options.kind,
        scale: options.scale ?? 1
      };
    });
    engine.updateInstance.mockImplementation((instance, patch) => Object.assign(instance, patch));
  });

  afterEach(() => {
    act(() => root.unmount());
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('renders an interactive child and forwards valid prop updates to the engine', () => {
    const onClick = vi.fn();
    act(() =>
      root.render(
        <MetalFx strength={0.25}>
          <button type="button" onClick={onClick}>
            Use effect
          </button>
        </MetalFx>
      )
    );
    const button = container.querySelector('button');
    button?.click();
    expect(onClick).toHaveBeenCalledOnce();
    expect(engine.createInstance).toHaveBeenCalledOnce();

    act(() =>
      root.render(
        <MetalFx finish="brushed" paused preset="silver" strength={2} theme="light">
          <button type="button">Use effect</button>
        </MetalFx>
      )
    );
    expect(engine.updateInstance).toHaveBeenCalledWith(expect.anything(), { paused: true });
    expect(engine.updateInstance).toHaveBeenCalledWith(expect.anything(), { opacityMul: 1 });
    expect(engine.updateInstance).toHaveBeenCalledWith(expect.anything(), {
      preset: 'silver',
      theme: 'light',
      finish: 'brushed'
    });
    expect(engine.createInstance).toHaveBeenCalledOnce();
    expect(container.querySelector('.metal-fx-root')?.getAttribute('data-finish')).toBe('brushed');
  });

  it('applies material tokens with explicit props taking precedence (RFC 0001)', () => {
    act(() =>
      root.render(
        <MetalFx material="copper">
          <button type="button">Use effect</button>
        </MetalFx>
      )
    );
    const rootEl = container.querySelector('.metal-fx-root') as HTMLElement;
    expect(rootEl.getAttribute('data-finish')).toBe('brushed');
    expect(rootEl.style.getPropertyValue('--mfx-strength')).toBe('0.88');
    expect(engine.updateInstance).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ preset: 'gold', finish: 'brushed' })
    );

    act(() =>
      root.render(
        <MetalFx material="copper" finish="polished" strength={0.4}>
          <button type="button">Use effect</button>
        </MetalFx>
      )
    );
    expect(rootEl.getAttribute('data-finish')).toBe('polished');
    expect(rootEl.style.getPropertyValue('--mfx-strength')).toBe('0.4');
    expect(engine.updateInstance).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ preset: 'gold', finish: 'polished' })
    );
  });

  it('falls back to component defaults for unknown runtime material names', () => {
    act(() =>
      root.render(
        <MetalFx material={'typo-material' as never}>
          <button type="button">Use effect</button>
        </MetalFx>
      )
    );
    const rootEl = container.querySelector('.metal-fx-root') as HTMLElement;
    expect(rootEl.getAttribute('data-finish')).toBe('polished');
    expect(rootEl.style.getPropertyValue('--mfx-strength')).toBe('1');
  });

  it('releases its reflection ownership by instance across StrictMode cleanup and remount', () => {
    const target = { current: document.createElement('button') };
    act(() =>
      root.render(
        <StrictMode>
          <MetalFx reflectionTargets={[target]} theme="dark">
            <button type="button">Use effect</button>
          </MetalFx>
        </StrictMode>
      )
    );

    expect(addReflectionTarget).toHaveBeenCalledTimes(2);
    expect(removeReflectionTarget).toHaveBeenCalledTimes(1);
    expect(removeReflectionTarget).toHaveBeenLastCalledWith(target.current, expect.anything());

    act(() => root.unmount());
    expect(removeReflectionTarget).toHaveBeenCalledTimes(2);
  });

  it('moves reflection ownership when a ref becomes live and later changes target', () => {
    const target = { current: null as HTMLElement | null };
    const render = () =>
      act(() =>
        root.render(
          <MetalFx reflectionTargets={[target]} theme="dark">
            <button type="button">Use effect</button>
          </MetalFx>
        )
      );

    render();
    expect(addReflectionTarget).not.toHaveBeenCalled();

    const first = document.createElement('div');
    target.current = first;
    render();
    expect(addReflectionTarget).toHaveBeenLastCalledWith(first, expect.anything(), expect.anything());

    const second = document.createElement('div');
    target.current = second;
    render();
    expect(removeReflectionTarget).toHaveBeenLastCalledWith(first, expect.anything());
    expect(addReflectionTarget).toHaveBeenLastCalledWith(second, expect.anything(), expect.anything());
  });

  it('cleans up the renderer instance on final unmount', () => {
    act(() =>
      root.render(
        <MetalFx>
          <button type="button">Use effect</button>
        </MetalFx>
      )
    );
    act(() => root.unmount());
    expect(engine.unregisterGlowInstance).toHaveBeenCalledOnce();
    expect(engine.destroyInstance).toHaveBeenCalledOnce();
  });

  it('creates glow work only while glow is enabled and removes it between prop transitions', () => {
    const render = (disableGlow: boolean) =>
      act(() =>
        root.render(
          <MetalFx disableGlow={disableGlow}>
            <button type="button">Use effect</button>
          </MetalFx>
        )
      );

    render(true);
    expect(injectGlow).not.toHaveBeenCalled();
    expect(setGlowHandles).not.toHaveBeenCalled();
    expect(engine.registerGlowInstance).not.toHaveBeenCalled();

    render(false);
    expect(engine.createInstance).toHaveBeenCalledOnce();
    expect(injectGlow).toHaveBeenCalledOnce();
    expect(engine.registerGlowInstance).toHaveBeenCalledOnce();
    expect(container.querySelectorAll('.metal-fx-glow-svg')).toHaveLength(1);

    render(true);
    expect(deleteGlowHandles).toHaveBeenCalledOnce();
    expect(engine.unregisterGlowInstance).toHaveBeenCalledOnce();
    expect(container.querySelector('.metal-fx-glow-svg')).toBeNull();

    render(false);
    expect(engine.createInstance).toHaveBeenCalledOnce();
    expect(injectGlow).toHaveBeenCalledTimes(2);
    expect(engine.registerGlowInstance).toHaveBeenCalledTimes(2);
  });

  it('keeps the renderer active when optional glow setup fails', () => {
    glow.injectGlow.mockImplementationOnce(() => {
      throw new Error('glow setup failed');
    });

    expect(() =>
      act(() =>
        root.render(
          <MetalFx>
            <button type="button">Use effect</button>
          </MetalFx>
        )
      )
    ).not.toThrow();
    expect(container.querySelector<HTMLDivElement>('.metal-fx-root')?.dataset.fallback).toBeUndefined();
    expect(engine.destroyInstance).not.toHaveBeenCalled();
    expect(engine.registerGlowInstance).not.toHaveBeenCalled();
  });

  it('keeps renderer and glow lifecycle work paired through a StrictMode remount', () => {
    act(() =>
      root.render(
        <StrictMode>
          <MetalFx>
            <button type="button">Use effect</button>
          </MetalFx>
        </StrictMode>
      )
    );
    expect(engine.createInstance).toHaveBeenCalledTimes(2);
    expect(engine.destroyInstance).toHaveBeenCalledOnce();
    expect(engine.registerGlowInstance).toHaveBeenCalledTimes(2);
    expect(engine.unregisterGlowInstance).toHaveBeenCalledOnce();

    act(() => root.unmount());
    expect(engine.destroyInstance).toHaveBeenCalledTimes(2);
    expect(engine.unregisterGlowInstance).toHaveBeenCalledTimes(2);
  });

  it('moves glow registration to the recreated renderer instance when shape changes', () => {
    act(() =>
      root.render(
        <MetalFx>
          <button type="button">Use effect</button>
        </MetalFx>
      )
    );
    act(() =>
      root.render(
        <MetalFx variant="circle">
          <button type="button">Use effect</button>
        </MetalFx>
      )
    );

    expect(engine.createInstance).toHaveBeenCalledTimes(2);
    expect(engine.destroyInstance).toHaveBeenCalledOnce();
    expect(injectGlow).toHaveBeenCalledTimes(2);
    expect(engine.registerGlowInstance).toHaveBeenCalledTimes(2);
    expect(engine.unregisterGlowInstance).toHaveBeenCalledOnce();
    expect(container.querySelectorAll('.metal-fx-glow-svg')).toHaveLength(1);
  });

  it('does not register glow during a StrictMode disabled mount and cleans up a later enabled glow', () => {
    act(() =>
      root.render(
        <StrictMode>
          <MetalFx disableGlow>
            <button type="button">Use effect</button>
          </MetalFx>
        </StrictMode>
      )
    );
    expect(engine.createInstance).toHaveBeenCalledTimes(2);
    expect(engine.destroyInstance).toHaveBeenCalledOnce();
    expect(injectGlow).not.toHaveBeenCalled();

    act(() =>
      root.render(
        <StrictMode>
          <MetalFx>
            <button type="button">Use effect</button>
          </MetalFx>
        </StrictMode>
      )
    );
    expect(injectGlow).toHaveBeenCalledOnce();
    expect(engine.registerGlowInstance).toHaveBeenCalledOnce();

    act(() => root.unmount());
    expect(engine.unregisterGlowInstance).toHaveBeenCalledOnce();
    expect(engine.destroyInstance).toHaveBeenCalledTimes(2);
  });
});
