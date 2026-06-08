// Runtime theme registry.
//
// Ignite UI ships separate CSS bundles per (variant × palette) for the
// web-components base (used by IgrButton, IgrTabs, IgrSelect, etc.) and for
// the advanced grids. We import every bundle through Vite's `?url` loader so
// the bundler emits them as static assets, then swap the active `<link>` href
// at runtime. This is what lets the Config pane flip Light/Dark ×
// Material/Bootstrap/Fluent/Indigo live without a reload.

// Web-components base themes
import wcLightMaterial from 'igniteui-webcomponents/themes/light/material.css?url';
import wcLightBootstrap from 'igniteui-webcomponents/themes/light/bootstrap.css?url';
import wcLightFluent from 'igniteui-webcomponents/themes/light/fluent.css?url';
import wcLightIndigo from 'igniteui-webcomponents/themes/light/indigo.css?url';
import wcDarkMaterial from 'igniteui-webcomponents/themes/dark/material.css?url';
import wcDarkBootstrap from 'igniteui-webcomponents/themes/dark/bootstrap.css?url';
import wcDarkFluent from 'igniteui-webcomponents/themes/dark/fluent.css?url';
import wcDarkIndigo from 'igniteui-webcomponents/themes/dark/indigo.css?url';

// Grid themes
import gridLightMaterial from 'igniteui-react-grids/grids/themes/light/material.css?url';
import gridLightBootstrap from 'igniteui-react-grids/grids/themes/light/bootstrap.css?url';
import gridLightFluent from 'igniteui-react-grids/grids/themes/light/fluent.css?url';
import gridLightIndigo from 'igniteui-react-grids/grids/themes/light/indigo.css?url';
import gridDarkMaterial from 'igniteui-react-grids/grids/themes/dark/material.css?url';
import gridDarkBootstrap from 'igniteui-react-grids/grids/themes/dark/bootstrap.css?url';
import gridDarkFluent from 'igniteui-react-grids/grids/themes/dark/fluent.css?url';
import gridDarkIndigo from 'igniteui-react-grids/grids/themes/dark/indigo.css?url';

export type ThemeVariant = 'light' | 'dark';
export type ThemePalette = 'material' | 'bootstrap' | 'fluent' | 'indigo';
export type ThemeSize = 'small' | 'medium' | 'large';

export const PALETTES: ThemePalette[] = ['material', 'bootstrap', 'fluent', 'indigo'];
export const VARIANTS: ThemeVariant[] = ['dark', 'light'];
export const SIZES: ThemeSize[] = ['small', 'medium', 'large'];

const wc: Record<ThemeVariant, Record<ThemePalette, string>> = {
  light: { material: wcLightMaterial, bootstrap: wcLightBootstrap, fluent: wcLightFluent, indigo: wcLightIndigo },
  dark: { material: wcDarkMaterial, bootstrap: wcDarkBootstrap, fluent: wcDarkFluent, indigo: wcDarkIndigo },
};

const grid: Record<ThemeVariant, Record<ThemePalette, string>> = {
  light: { material: gridLightMaterial, bootstrap: gridLightBootstrap, fluent: gridLightFluent, indigo: gridLightIndigo },
  dark: { material: gridDarkMaterial, bootstrap: gridDarkBootstrap, fluent: gridDarkFluent, indigo: gridDarkIndigo },
};

function ensureLink(id: string): HTMLLinkElement {
  let link = document.getElementById(id) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  return link;
}

/** Numeric --ig-size used by Ignite UI for density. */
export const SIZE_VALUE: Record<ThemeSize, string> = {
  small: '1',
  medium: '2',
  large: '3',
};

/**
 * Apply a full theme selection: swaps the Ignite UI base + grid stylesheets,
 * sets the dock-manager light/dark class, the palette/variant data attributes
 * our palette.css keys off of, and the global --ig-size density token.
 */
export function applyTheme(variant: ThemeVariant, palette: ThemePalette, size: ThemeSize) {
  ensureLink('ig-theme-wc').href = wc[variant][palette];
  ensureLink('ig-theme-grid').href = grid[variant][palette];

  const root = document.documentElement;
  root.dataset.variant = variant;
  root.dataset.palette = palette;
  root.style.setProperty('--ig-size', SIZE_VALUE[size]);
  root.style.colorScheme = variant;

  // The Dock Manager reads light-theme / dark-theme from an ancestor.
  root.classList.toggle('dark-theme', variant === 'dark');
  root.classList.toggle('light-theme', variant === 'light');
}
