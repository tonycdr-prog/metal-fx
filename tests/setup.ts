import { afterEach, vi } from 'vitest';

class ResizeObserverMock {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

if (typeof window !== 'undefined') {
  Object.defineProperty(globalThis, 'ResizeObserver', { configurable: true, value: ResizeObserverMock });
  Object.defineProperty(globalThis, 'IntersectionObserver', { configurable: true, value: undefined });
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({ addEventListener: vi.fn(), matches: false, removeEventListener: vi.fn() }))
  });
  Object.defineProperty(window, 'requestAnimationFrame', {
    configurable: true,
    value: (cb: FrameRequestCallback) => setTimeout(cb, 0)
  });
  Object.defineProperty(window, 'cancelAnimationFrame', { configurable: true, value: clearTimeout });
}

afterEach(() => {
  if (typeof document !== 'undefined') document.body.replaceChildren();
});
