import { act } from 'react';
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
  afterEach(() => vi.clearAllMocks());

  it.each(['auto', 'dark', 'light'] as const)('hydrates %s without warnings', async (theme) => {
    const media = { addEventListener: vi.fn(), matches: false, removeEventListener: vi.fn() };
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => media) });
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = renderToString(render(theme));
    const errors = vi.spyOn(console, 'error');
    const warnings = vi.spyOn(console, 'warn');
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, render(theme));
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(errors).not.toHaveBeenCalled();
    expect(warnings).not.toHaveBeenCalled();
    if (theme === 'auto') expect(window.matchMedia).toHaveBeenCalled();
    expect(container.firstElementChild?.getAttribute('data-theme')).toBe(theme === 'auto' ? 'light' : theme);
    if (theme === 'auto') {
      media.matches = true;
      await act(async () => media.addEventListener.mock.calls[0][1]());
      expect(container.firstElementChild?.getAttribute('data-theme')).toBe('dark');
    }
    await act(async () => root?.unmount());
    if (theme === 'auto') expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    errors.mockRestore();
    warnings.mockRestore();
  });
});
