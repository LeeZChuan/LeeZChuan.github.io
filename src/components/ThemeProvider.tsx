'use client';

import { useEffect } from 'react';
import {
  applyTheme,
  getNextThemeBoundary,
  removeLegacyThemePreference,
  resolveTheme,
} from '@/lib/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function syncTheme() {
      applyTheme(resolveTheme());
      clearTimeout(timeoutId);
      timeoutId = setTimeout(syncTheme, getNextThemeBoundary().getTime() - Date.now() + 100);
    }

    removeLegacyThemePreference();
    syncTheme();

    window.addEventListener('focus', syncTheme);
    document.addEventListener('visibilitychange', syncTheme);
    window.addEventListener('storage', syncTheme);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('focus', syncTheme);
      document.removeEventListener('visibilitychange', syncTheme);
      window.removeEventListener('storage', syncTheme);
    };
  }, []);

  return <>{children}</>;
}
