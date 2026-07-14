import { act, createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clampInteractionSignal, type InteractionMode, useInteractionSignal } from './useInteractionSignal';

interface HarnessProps {
  host: HTMLElement;
  mode: InteractionMode;
  reducedMotion?: boolean;
}

function Harness({ host, mode, reducedMotion = false }: HarnessProps) {
  const signal = useInteractionSignal(mode, reducedMotion, host);
  return createElement('output', null, signal.toFixed(2));
}

function pointerMove(clientX: number): PointerEvent {
  const event = new Event('pointermove') as PointerEvent;
  Object.defineProperty(event, 'clientX', { value: clientX });
  return event;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('interaction signals', () => {
  it('bounds presentation signals', () => {
    expect(clampInteractionSignal(-2)).toBe(-1);
    expect(clampInteractionSignal(0.4)).toBe(0.4);
    expect(clampInteractionSignal(2)).toBe(1);
  });

  it('coalesces rapid pointer input to the latest bounded value', () => {
    const host = document.createElement('div');
    vi.spyOn(host, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 100 } as DOMRect);
    let flush: FrameRequestCallback | undefined;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      flush = callback;
      return 7;
    });
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => root.render(createElement(Harness, { host, mode: 'pointer-position' })));
    act(() => {
      host.dispatchEvent(pointerMove(0));
      host.dispatchEvent(pointerMove(100));
      flush?.(0);
    });

    expect(container.textContent).toBe('1.00');
    act(() => root.unmount());
  });

  it('balances listeners and cancels pending work through a StrictMode cleanup', () => {
    const host = document.createElement('div');
    vi.spyOn(host, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 100 } as DOMRect);
    const add = vi.spyOn(host, 'addEventListener');
    const remove = vi.spyOn(host, 'removeEventListener');
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(11);
    const cancel = vi.spyOn(window, 'cancelAnimationFrame');
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => root.render(createElement(StrictMode, null, createElement(Harness, { host, mode: 'pointer-position' }))));
    act(() => host.dispatchEvent(pointerMove(25)));
    act(() => root.unmount());

    expect(cancel).toHaveBeenCalledWith(11);
    expect(remove.mock.calls.filter(([type]) => type === 'pointermove')).toHaveLength(
      add.mock.calls.filter(([type]) => type === 'pointermove').length
    );
  });

  it('does not install interaction listeners when reduced motion is active', () => {
    const host = document.createElement('div');
    const add = vi.spyOn(host, 'addEventListener');
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => root.render(createElement(Harness, { host, mode: 'pointer-position', reducedMotion: true })));
    expect(add).not.toHaveBeenCalled();
    act(() => root.unmount());
  });
});
