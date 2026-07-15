import { act, type RefObject, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MetalFxInstance } from '../engine/renderer/core';
import { useMaterialInteraction } from './useMaterialInteraction';

const engine = vi.hoisted(() => ({ updateInstance: vi.fn() }));
vi.mock('../engine/renderer/loop', () => engine);

function Harness({ enabled, instance }: { enabled: boolean; instance: MetalFxInstance }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef(instance);
  useMaterialInteraction({ enabled, instanceRef, rootRef: rootRef as RefObject<HTMLDivElement> });
  return (
    <div ref={rootRef}>
      <button type="button">Use effect</button>
    </div>
  );
}

describe('useMaterialInteraction', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  const instance = {} as MetalFxInstance;

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

  it('maps pointer and keyboard input and resets its instance on cleanup', () => {
    act(() => root.render(<Harness enabled instance={instance} />));
    const wrapper = container.firstElementChild as HTMLDivElement;
    const button = container.querySelector('button');
    vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({
      bottom: 40,
      height: 40,
      left: 0,
      right: 120,
      top: 0,
      width: 120,
      x: 0,
      y: 0,
      toJSON: () => ({})
    });

    act(() => wrapper.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 90, clientY: 10 })));
    expect(engine.updateInstance).toHaveBeenLastCalledWith(instance, {
      lightX: 0.75,
      lightY: 0.75,
      lightIntensity: 1
    });
    act(() => wrapper.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 90, clientY: 10 })));
    expect(engine.updateInstance).toHaveBeenLastCalledWith(instance, { press: 1 });
    act(() => window.dispatchEvent(new MouseEvent('pointerup')));
    expect(engine.updateInstance).toHaveBeenLastCalledWith(instance, { press: 0, lightIntensity: 1 });

    act(() => button?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })));
    expect(engine.updateInstance).toHaveBeenLastCalledWith(instance, {
      lightX: 0.5,
      lightY: 0.5,
      lightIntensity: 1,
      press: 1
    });

    act(() => root.render(<Harness enabled={false} instance={instance} />));
    expect(engine.updateInstance).toHaveBeenLastCalledWith(instance, {
      lightX: 0.5,
      lightY: 0.5,
      lightIntensity: 0,
      press: 0
    });
  });
});
