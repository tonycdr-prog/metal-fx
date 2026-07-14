import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

export function useTheme(): Theme {
  const [theme] = useState<Theme>('dark');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return theme;
}
