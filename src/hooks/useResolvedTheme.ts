import { useEffect, useState } from 'react';
import type { MetalFxTheme } from '../types';

/** Resolves an automatic theme and subscribes to system preference changes. */
export function useResolvedTheme(theme: MetalFxTheme): 'dark' | 'light' {
  const [resolved, setResolved] = useState<'dark' | 'light'>(() => {
    if (theme !== 'auto') return theme;
    if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme !== 'auto') {
      setResolved(theme);
      return;
    }
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setResolved(mediaQuery.matches ? 'dark' : 'light');
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, [theme]);

  return resolved;
}
