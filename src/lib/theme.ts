export type Theme = 'light' | 'dark';

const THEME_OVERRIDE_KEY = 'theme-override';
const LEGACY_THEME_KEY = 'theme';
const SUNRISE_HOUR = 6;
const SUNSET_HOUR = 18;

type ThemeOverride = {
  theme: Theme;
  expiresAt: number;
};

export const THEME_CHANGE_EVENT = 'themechange';

export function getScheduledTheme(date = new Date()): Theme {
  const hour = date.getHours();
  return hour >= SUNRISE_HOUR && hour < SUNSET_HOUR ? 'light' : 'dark';
}

export function getNextThemeBoundary(date = new Date()): Date {
  const next = new Date(date);
  const hour = date.getHours();

  if (hour < SUNRISE_HOUR) {
    next.setHours(SUNRISE_HOUR, 0, 0, 0);
  } else if (hour < SUNSET_HOUR) {
    next.setHours(SUNSET_HOUR, 0, 0, 0);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(SUNRISE_HOUR, 0, 0, 0);
  }

  return next;
}

function readThemeOverride(date = new Date()): ThemeOverride | null {
  try {
    const stored = localStorage.getItem(THEME_OVERRIDE_KEY);
    if (!stored) return null;

    const override = JSON.parse(stored) as Partial<ThemeOverride>;
    const isValidTheme = override.theme === 'light' || override.theme === 'dark';
    const isActive = typeof override.expiresAt === 'number' && override.expiresAt > date.getTime();

    if (isValidTheme && isActive) {
      return override as ThemeOverride;
    }

    localStorage.removeItem(THEME_OVERRIDE_KEY);
  } catch {}

  return null;
}

export function resolveTheme(date = new Date()): Theme {
  return readThemeOverride(date)?.theme ?? getScheduledTheme(date);
}

export function saveThemeOverride(theme: Theme, date = new Date()) {
  const override: ThemeOverride = {
    theme,
    expiresAt: getNextThemeBoundary(date).getTime(),
  };

  try {
    localStorage.setItem(THEME_OVERRIDE_KEY, JSON.stringify(override));
  } catch {}
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: theme }));
}

export function removeLegacyThemePreference() {
  try {
    localStorage.removeItem(LEGACY_THEME_KEY);
  } catch {}
}
