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
const glow = vi.hoisted(() => ({ injectGlow: vi.fn(() => ({ marker: 'glow' })) }));

vi.mock('./engine/renderer/loop', () => engine);
vi.mock('./engine/glow/glow', () => glow);
vi.mock('./engine/glow/registry', () => ({ deleteGlowHandles: vi.fn(), setGlowHandles: vi.fn() }));
vi.mock('./engine/reflection/paint', () => ({ addReflectionTarget: vi.fn(), removeReflectionTarget: vi.fn() }));
vi.mock('./engine/reflection/reflectionScheduler', () => ({ scheduleReflectionPaint: vi.fn() }));

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
        <MetalFx paused preset="silver" strength={2} theme="light">
          <button type="button" onClick={onClick}>
            Use effect
          </button>
        </MetalFx>
      )
    );
    expect(engine.updateInstance).toHaveBeenCalledWith(expect.anything(), { paused: true });
    expect(engine.updateInstance).toHaveBeenCalledWith(expect.anything(), { opacityMul: 1 });
    expect(engine.updateInstance).toHaveBeenCalledWith(expect.anything(), { preset: 'silver', theme: 'light' });
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

  it('keeps the native child visible and interactive when renderer initialization fails', () => {
    engine.createInstance.mockImplementationOnce(() => {
      throw new Error('metal-fx: WebGL not supported');
    });
    const onClick = vi.fn();

    expect(() =>
      act(() =>
        root.render(
          <MetalFx>
            <button type="button" onClick={onClick}>
              Use fallback
            </button>
          </MetalFx>
        )
      )
    ).not.toThrow();

    const wrapper = container.querySelector<HTMLDivElement>('.metal-fx-root');
    const button = container.querySelector('button');
    expect(wrapper?.dataset.fallback).toBe('true');
    expect(wrapper?.dataset.normalize).toBe('false');
    expect(wrapper?.style.visibility).toBe('visible');
    button?.click();
    expect(onClick).toHaveBeenCalledOnce();
    expect(glow.injectGlow).not.toHaveBeenCalled();
    expect(engine.registerGlowInstance).not.toHaveBeenCalled();
    expect(engine.destroyInstance).not.toHaveBeenCalled();
  });

  it('cleans a partially initialized instance and can retry after fallback', () => {
    glow.injectGlow.mockImplementationOnce(() => {
      throw new Error('glow initialization failed');
    });

    act(() =>
      root.render(
        <MetalFx>
          <button type="button">Use fallback</button>
        </MetalFx>
      )
    );
    expect(container.querySelector<HTMLDivElement>('.metal-fx-root')?.dataset.fallback).toBe('true');
    expect(engine.destroyInstance).toHaveBeenCalledOnce();
    expect(engine.registerGlowInstance).not.toHaveBeenCalled();

    act(() =>
      root.render(
        <MetalFx variant="circle">
          <button type="button">Retry effect</button>
        </MetalFx>
      )
    );
    expect(engine.createInstance).toHaveBeenCalledTimes(2);
    expect(container.querySelector<HTMLDivElement>('.metal-fx-root')?.dataset.fallback).toBeUndefined();
    expect(engine.registerGlowInstance).toHaveBeenCalledOnce();
  });

  it('keeps failed StrictMode setup and cleanup balanced', () => {
    engine.createInstance.mockImplementation(() => {
      throw new Error('metal-fx: WebGL not supported');
    });

    act(() =>
      root.render(
        <StrictMode>
          <MetalFx>
            <button type="button">Use fallback</button>
          </MetalFx>
        </StrictMode>
      )
    );

    expect(engine.createInstance).toHaveBeenCalledTimes(2);
    expect(engine.destroyInstance).not.toHaveBeenCalled();
    expect(engine.unregisterGlowInstance).not.toHaveBeenCalled();
    expect(container.querySelector<HTMLDivElement>('.metal-fx-root')?.dataset.fallback).toBe('true');
  });
});
