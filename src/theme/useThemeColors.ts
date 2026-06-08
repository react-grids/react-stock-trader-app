import { useMemo } from 'react';
import { useTheme } from './ThemeContext';

export interface ResolvedColors {
  gain: string;
  loss: string;
  accent: string;
  surface: string;
  surface2: string;
  border: string;
  textMuted: string;
  text: string;
}

function read(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * Resolve the app palette CSS variables into concrete color strings. The
 * canvas-rendered financial chart can't consume CSS custom properties, so we
 * read the computed values and re-resolve whenever the theme variant/palette
 * changes.
 */
export function useThemeColors(): ResolvedColors {
  const { variant, palette } = useTheme();
  return useMemo<ResolvedColors>(
    () => ({
      gain: read('--app-gain', '#2ee08a'),
      loss: read('--app-loss', '#ff5b6e'),
      accent: read('--app-accent', '#4aa3ff'),
      surface: read('--app-surface', '#121826'),
      surface2: read('--app-surface-2', '#0e131f'),
      border: read('--app-border', '#232c40'),
      textMuted: read('--app-text-muted', '#8a97ad'),
      text: read('--app-text', '#e6ecf5'),
    }),
    // re-resolve after the theme attributes/stylesheet have been applied
    [variant, palette],
  );
}
