import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const engine = vi.hoisted(() => ({
  createInstance: vi.fn(),
  destroyInstance: vi.fn(),
  registerGlowInstance: vi.fn(),
  setInstanceVisible: vi.fn(),
  setSharedPreset: vi.fn(),
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
      return { cssHeight: options.cssHeight, cssWidth: options.cssWidth, kind: options.kind };
    });
  });

  afterEach(() => {
    act(() => root.unmount());
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
    expect(button).not.toBeNull();
    button?.click();
    expect(onClick).toHaveBeenCalledOnce();
    expect(engine.createInstance).toHaveBeenCalledOnce();

    act(() =>
      root.render(
        <MetalFx paused strength={2}>
          <button type="button" onClick={onClick}>
            Use effect
          </button>
        </MetalFx>
      )
    );
    expect(engine.updateInstance).toHaveBeenCalledWith(expect.anything(), { paused: true });
    expect(engine.updateInstance).toHaveBeenCalledWith(expect.anything(), { opacityMul: 1 });
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
    act(() =>
      root.render(
        <MetalFx disableGlow>
          <button type="button">Use effect</button>
        </MetalFx>
      )
    );

    expect(injectGlow).not.toHaveBeenCalled();
    expect(setGlowHandles).not.toHaveBeenCalled();
    expect(engine.registerGlowInstance).not.toHaveBeenCalled();
    expect(container.querySelector('.metal-fx-glow-svg')).toBeNull();

    act(() =>
      root.render(
        <MetalFx>
          <button type="button">Use effect</button>
        </MetalFx>
      )
    );

    expect(engine.createInstance).toHaveBeenCalledOnce();
    expect(injectGlow).toHaveBeenCalledOnce();
    expect(setGlowHandles).toHaveBeenCalledOnce();
    expect(engine.registerGlowInstance).toHaveBeenCalledOnce();
    expect(container.querySelectorAll('.metal-fx-glow-svg')).toHaveLength(1);

    act(() =>
      root.render(
        <MetalFx disableGlow>
          <button type="button">Use effect</button>
        </MetalFx>
      )
    );

    expect(deleteGlowHandles).toHaveBeenCalledOnce();
    expect(engine.unregisterGlowInstance).toHaveBeenCalledOnce();
    expect(container.querySelector('.metal-fx-glow-svg')).toBeNull();

    act(() =>
      root.render(
        <MetalFx>
          <button type="button">Use effect</button>
        </MetalFx>
      )
    );

    expect(engine.createInstance).toHaveBeenCalledOnce();
    expect(injectGlow).toHaveBeenCalledTimes(2);
    expect(setGlowHandles).toHaveBeenCalledTimes(2);
    expect(engine.registerGlowInstance).toHaveBeenCalledTimes(2);
    expect(container.querySelectorAll('.metal-fx-glow-svg')).toHaveLength(1);
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
    expect(engine.registerGlowInstance).not.toHaveBeenCalled();

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
    expect(container.querySelectorAll('.metal-fx-glow-svg')).toHaveLength(1);

    act(() => root.unmount());
    expect(engine.unregisterGlowInstance).toHaveBeenCalledOnce();
    expect(engine.destroyInstance).toHaveBeenCalledTimes(2);
    expect(container.querySelector('.metal-fx-glow-svg')).toBeNull();
  });
});
