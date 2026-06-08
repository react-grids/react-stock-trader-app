import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  applyTheme,
  type ThemePalette,
  type ThemeSize,
  type ThemeVariant,
} from './themeRegistry';

interface ThemeState {
  variant: ThemeVariant;
  palette: ThemePalette;
  size: ThemeSize;
  setVariant: (v: ThemeVariant) => void;
  setPalette: (p: ThemePalette) => void;
  setSize: (s: ThemeSize) => void;
}

const ThemeCtx = createContext<ThemeState | null>(null);

const STORAGE_KEY = 'fintrader.theme';

interface Persisted {
  variant: ThemeVariant;
  palette: ThemePalette;
  size: ThemeSize;
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Persisted;
  } catch {
    /* ignore */
  }
  return { variant: 'dark', palette: 'material', size: 'small' };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(load, []);
  const [variant, setVariant] = useState<ThemeVariant>(initial.variant);
  const [palette, setPalette] = useState<ThemePalette>(initial.palette);
  const [size, setSize] = useState<ThemeSize>(initial.size);

  // Apply the theme during render (idempotent DOM writes) so the palette
  // attributes are present before descendants read computed CSS variables —
  // e.g. the canvas chart resolving gain/loss colors via useThemeColors.
  // An effect would run after children render, leaving them a frame stale.
  useMemo(() => applyTheme(variant, palette, size), [variant, palette, size]);

  // Persistence is a true side-effect; keep it in an effect.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ variant, palette, size }));
    } catch {
      /* ignore */
    }
  }, [variant, palette, size]);

  const value = useMemo<ThemeState>(
    () => ({ variant, palette, size, setVariant, setPalette, setSize }),
    [variant, palette, size],
  );

  return <ThemeCtx value={value}>{children}</ThemeCtx>;
}

// React 19: read context with the `use` hook.
export function useTheme(): ThemeState {
  const ctx = use(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
