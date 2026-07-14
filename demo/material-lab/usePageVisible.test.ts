import { act, createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePageVisible } from './usePageVisible';

function Harness() {
  return createElement('output', null, usePageVisible() ? 'visible' : 'hidden');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('page visibility', () => {
  it('balances its visibility listener through a StrictMode cleanup', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => root.render(createElement(StrictMode, null, createElement(Harness))));
    act(() => root.unmount());

    expect(remove.mock.calls.filter(([type]) => type === 'visibilitychange')).toHaveLength(
      add.mock.calls.filter(([type]) => type === 'visibilitychange').length
    );
  });
});
