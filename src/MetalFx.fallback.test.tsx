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
const glow = vi.hoisted(() => ({ injectGlow: vi.fn(() => ({ marker: 'glow' })) }));

vi.mock('./engine/renderer/loop', () => engine);
vi.mock('./engine/glow/glow', () => glow);
vi.mock('./engine/glow/registry', () => ({ deleteGlowHandles: vi.fn(), setGlowHandles: vi.fn() }));
vi.mock('./engine/reflection/paint', () => ({ addReflectionTarget: vi.fn(), removeReflectionTarget: vi.fn() }));
vi.mock('./engine/reflection/reflectionScheduler', () => ({ scheduleReflectionPaint: vi.fn() }));

import { MetalFx } from './MetalFx';

describe('MetalFx renderer fallback', () => {
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
  });

  afterEach(() => {
    act(() => root.unmount());
    vi.restoreAllMocks();
    vi.clearAllMocks();
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
    expect(wrapper?.dataset.fallback).toBe('true');
    expect(wrapper?.dataset.normalize).toBe('false');
    expect(wrapper?.style.visibility).toBe('visible');
    container.querySelector('button')?.click();
    expect(onClick).toHaveBeenCalledOnce();
    expect(glow.injectGlow).not.toHaveBeenCalled();
    expect(engine.registerGlowInstance).not.toHaveBeenCalled();
    expect(engine.destroyInstance).not.toHaveBeenCalled();
  });

  it('cleans partial setup, restores radius styles, and can retry after fallback', () => {
    const resizeObserver = vi.spyOn(globalThis, 'ResizeObserver').mockImplementationOnce(() => {
      throw new Error('observer initialization failed');
    });

    act(() =>
      root.render(
        <MetalFx style={{ borderRadius: '13px', ['--mfx-radius' as string]: '17px' }}>
          <button type="button">Use fallback</button>
        </MetalFx>
      )
    );
    const wrapper = container.querySelector<HTMLDivElement>('.metal-fx-root');
    expect(wrapper?.dataset.fallback).toBe('true');
    expect(wrapper?.style.borderRadius).toBe('13px');
    expect(wrapper?.style.getPropertyValue('--mfx-radius')).toBe('17px');
    expect(engine.destroyInstance).toHaveBeenCalledOnce();
    resizeObserver.mockRestore();

    act(() =>
      root.render(
        <MetalFx variant="circle">
          <button type="button">Retry effect</button>
        </MetalFx>
      )
    );
    expect(engine.createInstance).toHaveBeenCalledTimes(2);
    expect(wrapper?.dataset.fallback).toBeUndefined();
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
