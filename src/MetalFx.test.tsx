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

vi.mock('./engine/renderer/loop', () => engine);
vi.mock('./engine/glow/glow', () => ({ injectGlow: vi.fn(() => ({ marker: 'glow' })) }));
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
});
