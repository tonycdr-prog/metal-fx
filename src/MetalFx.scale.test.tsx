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
    container.appendChild(svg);
    return { svg };
  })
}));

vi.mock('./engine/renderer/loop', () => engine);
vi.mock('./engine/glow/glow', () => glow);
vi.mock('./engine/glow/registry', () => ({ deleteGlowHandles: vi.fn(), setGlowHandles: vi.fn() }));
vi.mock('./engine/reflection/paint', () => ({ addReflectionTarget: vi.fn(), removeReflectionTarget: vi.fn() }));
vi.mock('./engine/reflection/reflectionScheduler', () => ({ scheduleReflectionPaint: vi.fn() }));

import { injectGlow } from './engine/glow/glow';
import { addReflectionTarget } from './engine/reflection/paint';
import { MetalFx } from './MetalFx';

describe('MetalFx scale lifecycle', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    engine.createInstance.mockImplementation((options) => {
      options.onFirstCopy?.();
      return { scale: options.scale ?? 1 };
    });
    engine.updateInstance.mockImplementation((instance, patch) => Object.assign(instance, patch));
  });

  afterEach(() => {
    act(() => root.unmount());
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('updates glow and reflection consumers for 1 → 2 → 0.5 without recreating the renderer', () => {
    const target = { current: document.createElement('button') };
    const render = (scale: number) =>
      act(() =>
        root.render(
          <MetalFx reflectionTargets={[target]} scale={scale}>
            <button type="button">Use effect</button>
          </MetalFx>
        )
      );

    render(1);
    expect(injectGlow).toHaveBeenLastCalledWith(expect.any(HTMLElement), expect.objectContaining({ scale: 1 }));
    expect(addReflectionTarget).toHaveBeenCalledOnce();

    render(2);
    expect(engine.createInstance).toHaveBeenCalledOnce();
    expect(engine.updateInstance).toHaveBeenCalledWith(expect.anything(), { scale: 2 });
    expect(injectGlow).toHaveBeenLastCalledWith(expect.any(HTMLElement), expect.objectContaining({ scale: 2 }));
    expect(addReflectionTarget).toHaveBeenCalledOnce();

    render(0.5);
    expect(engine.createInstance).toHaveBeenCalledOnce();
    expect(engine.updateInstance).toHaveBeenCalledWith(expect.anything(), { scale: 0.5 });
    expect(injectGlow).toHaveBeenLastCalledWith(expect.any(HTMLElement), expect.objectContaining({ scale: 0.5 }));

    act(() => root.unmount());
    expect(engine.destroyInstance).toHaveBeenCalledOnce();
    expect(engine.unregisterGlowInstance).toHaveBeenCalledTimes(3);
  });

  it('keeps StrictMode renderer ownership stable across scale updates', () => {
    const render = (scale: number) =>
      act(() =>
        root.render(
          <StrictMode>
            <MetalFx scale={scale}>
              <button type="button">Use effect</button>
            </MetalFx>
          </StrictMode>
        )
      );

    render(1);
    render(2);
    render(0.5);

    expect(engine.createInstance).toHaveBeenCalledTimes(2);
    expect(engine.destroyInstance).toHaveBeenCalledOnce();
    expect(engine.updateInstance).toHaveBeenCalledWith(expect.anything(), { scale: 2 });
    expect(engine.updateInstance).toHaveBeenCalledWith(expect.anything(), { scale: 0.5 });

    act(() => root.unmount());
    expect(engine.destroyInstance).toHaveBeenCalledTimes(2);
  });
});
