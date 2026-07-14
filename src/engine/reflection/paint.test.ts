import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MetalFxInstance } from '../renderer/core';
import { addReflectionTarget, removeReflectionTarget } from './paint';

function instance(): MetalFxInstance {
  return { canvas: document.createElement('canvas') } as MetalFxInstance;
}

describe('reflection target ownership', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);
    vi.stubGlobal(
      'getComputedStyle',
      () =>
        ({
          position: 'static',
          isolation: 'auto',
          borderTopLeftRadius: '0px',
          borderTopRightRadius: '0px',
          borderBottomRightRadius: '0px',
          borderBottomLeftRadius: '0px',
          borderTopWidth: '0px',
          borderRightWidth: '0px',
          borderBottomWidth: '0px',
          borderLeftWidth: '0px',
          boxShadow: 'none'
        }) as CSSStyleDeclaration
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  it('keeps one decoration, transfers first-live ownership, and restores only MetalFx state after the final owner', () => {
    const targetEl = document.createElement('div');
    targetEl.setAttribute('data-metal-fx-reflect-host', 'external');
    document.body.appendChild(targetEl);
    const first = instance();
    const second = instance();
    const firstRoot = document.createElement('div');
    const secondRoot = document.createElement('div');

    const target = addReflectionTarget(targetEl, first, firstRoot);
    addReflectionTarget(targetEl, second, secondRoot);

    expect(target?.owners).toHaveLength(2);
    expect(target?.anchor).toBe(first);
    expect(targetEl.querySelectorAll('[data-metal-fx-reflection]')).toHaveLength(1);

    removeReflectionTarget(targetEl, first);
    expect(target?.anchor).toBe(second);
    expect(target?.anchorEl).toBe(secondRoot);
    expect(targetEl.querySelectorAll('[data-metal-fx-reflection]')).toHaveLength(1);

    targetEl.style.position = 'absolute';
    removeReflectionTarget(targetEl, second);
    expect(targetEl.querySelector('[data-metal-fx-reflection]')).toBeNull();
    expect(targetEl.getAttribute('data-metal-fx-reflect-host')).toBe('external');
    expect(targetEl.style.position).toBe('absolute');
    expect(targetEl.style.isolation).toBe('');
  });

  it('keeps the first owner active when a later owner is removed first', () => {
    const targetEl = document.createElement('div');
    const first = instance();
    const second = instance();
    const firstRoot = document.createElement('div');

    const target = addReflectionTarget(targetEl, first, firstRoot);
    addReflectionTarget(targetEl, second, document.createElement('div'));

    removeReflectionTarget(targetEl, second);
    expect(target?.owners).toHaveLength(1);
    expect(target?.anchor).toBe(first);
    expect(target?.anchorEl).toBe(firstRoot);
    expect(targetEl.querySelectorAll('[data-metal-fx-reflection]')).toHaveLength(1);

    removeReflectionTarget(targetEl, first);
    expect(targetEl.querySelector('[data-metal-fx-reflection]')).toBeNull();
  });

  it('does not overwrite a reflection-host marker changed by external code', () => {
    const targetEl = document.createElement('div');
    targetEl.setAttribute('data-metal-fx-reflect-host', 'before');
    const owner = instance();

    addReflectionTarget(targetEl, owner, document.createElement('div'));
    targetEl.setAttribute('data-metal-fx-reflect-host', 'changed-while-mounted');
    removeReflectionTarget(targetEl, owner);

    expect(targetEl.getAttribute('data-metal-fx-reflect-host')).toBe('changed-while-mounted');
  });
});
