import { act, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const engine = vi.hoisted(() => ({
  createInstance: vi.fn((options) => {
    options.onFirstCopy?.();
    return { cssHeight: options.cssHeight, cssWidth: options.cssWidth, kind: options.kind };
  }),
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

function render(theme: 'auto' | 'dark' | 'light') {
  return (
    <MetalFx theme={theme}>
      <button type="button">Use effect</button>
    </MetalFx>
  );
}

describe('MetalFx hydration', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it.each(['auto', 'dark', 'light'] as const)('hydrates %s without warnings', async (theme) => {
    const media = { addEventListener: vi.fn(), matches: false, removeEventListener: vi.fn() };
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => media) });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const strictRender = (nextTheme: 'auto' | 'dark' | 'light') => <StrictMode>{render(nextTheme)}</StrictMode>;
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnings = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // The node-environment SSR test verifies server rendering separately. This
    // jsdom render only seeds hydration markup and selects the browser layout
    // effect because `window` exists, so discard that test-environment warning.
    container.innerHTML = renderToString(strictRender(theme));
    errors.mockClear();
    warnings.mockClear();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, strictRender(theme));
        await Promise.resolve();
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(errors).not.toHaveBeenCalled();
      expect(warnings).not.toHaveBeenCalled();
      expect(engine.createInstance).toHaveBeenCalledTimes(2);
      expect(engine.destroyInstance).toHaveBeenCalledTimes(1);
      if (theme === 'auto') expect(window.matchMedia).toHaveBeenCalled();
      expect(container.firstElementChild?.getAttribute('data-theme')).toBe(theme === 'auto' ? 'light' : theme);
      if (theme === 'auto') {
        media.matches = true;
        const latestListener = media.addEventListener.mock.calls[media.addEventListener.mock.calls.length - 1]?.[1];
        await act(async () => latestListener());
        expect(container.firstElementChild?.getAttribute('data-theme')).toBe('dark');
      }

      const updatedTheme = theme === 'light' ? 'dark' : 'light';
      await act(async () => root?.render(strictRender(updatedTheme)));
      expect(container.firstElementChild?.getAttribute('data-theme')).toBe(updatedTheme);
      expect(engine.createInstance).toHaveBeenCalledTimes(2);
      expect(errors).not.toHaveBeenCalled();
      expect(warnings).not.toHaveBeenCalled();
    } finally {
      await act(async () => root?.unmount());
      errors.mockRestore();
      warnings.mockRestore();
    }
    expect(engine.destroyInstance).toHaveBeenCalledTimes(2);
    if (theme === 'auto')
      expect(media.removeEventListener).toHaveBeenCalledTimes(media.addEventListener.mock.calls.length);
  });
});
