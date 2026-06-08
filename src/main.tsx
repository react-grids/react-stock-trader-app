import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './app/app';
import { routes } from './app/app-routes';
import { ThemeProvider } from './theme/ThemeContext';
import { MarketProvider } from './state/MarketContext';
import { applyTheme, type ThemePalette, type ThemeSize, type ThemeVariant } from './theme/themeRegistry';

// Ignite UI module registration (grids + paginator + financial chart).
import { IgrGridModule, IgrPaginatorModule } from 'igniteui-react-grids';
import { IgrFinancialChartModule, IgrTreemapModule } from 'igniteui-react-charts';

// Dock Manager theme variables (overridden by our palette layer below).
import 'igniteui-dockmanager/themes/igc.themes.css';
// App theming + chrome (must load after the dock-manager defaults).
import './theme/palette.css';
import './components/ui.css';

[IgrGridModule, IgrPaginatorModule].forEach((m) => m.register());
IgrFinancialChartModule.register();
IgrTreemapModule.register();

// Apply the persisted theme synchronously so the Ignite UI stylesheets are
// present before first paint (avoids a flash of unstyled grids/dock).
(() => {
  let v: ThemeVariant = 'dark';
  let p: ThemePalette = 'material';
  let s: ThemeSize = 'small';
  try {
    const raw = localStorage.getItem('fintrader.theme');
    if (raw) {
      const parsed = JSON.parse(raw);
      v = parsed.variant ?? v;
      p = parsed.palette ?? p;
      s = parsed.size ?? s;
    }
  } catch {
    /* fall back to defaults */
  }
  applyTheme(v, p, s);
})();

const basename = import.meta.env.VITE_BASENAME || '/';

const router = createBrowserRouter(
  [{ element: <App />, children: [...routes] }],
  { basename },
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <MarketProvider>
        <RouterProvider router={router} />
      </MarketProvider>
    </ThemeProvider>
  </StrictMode>,
);
