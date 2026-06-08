import { useTheme } from '../theme/ThemeContext';
import { PALETTES, SIZES, VARIANTS, type ThemePalette, type ThemeVariant, type ThemeSize } from '../theme/themeRegistry';
import { useMarket } from '../state/MarketContext';

// Accent swatch colors shown in the picker (indicative of each palette family).
const PALETTE_SWATCH: Record<ThemePalette, string> = {
  material: '#4aa3ff',
  bootstrap: '#4f8cff',
  fluent: '#2ea0ff',
  indigo: '#8b8bff',
};

const VARIANT_LABEL: Record<ThemeVariant, string> = { dark: 'Dark', light: 'Light' };
const SIZE_LABEL: Record<ThemeSize, string> = { small: 'Small', medium: 'Medium', large: 'Large' };

export function ConfigPane() {
  const { variant, palette, size, setVariant, setPalette, setSize } = useTheme();
  const { quotes, positions, orders } = useMarket();

  return (
    <div className="config">
      <div className="config-group">
        <span className="config-label">Appearance</span>
        <div className="config-row">
          {VARIANTS.map((v) => (
            <button key={v} className={`swatch ${variant === v ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setVariant(v)}>
              {VARIANT_LABEL[v]}
            </button>
          ))}
        </div>
      </div>

      <div className="config-group">
        <span className="config-label">Theme Palette</span>
        <div className="swatch-grid">
          {PALETTES.map((p) => (
            <button key={p} className={`swatch ${palette === p ? 'active' : ''}`} onClick={() => setPalette(p)}>
              <span className="swatch-dot" style={{ background: PALETTE_SWATCH[p] }} />
              <span style={{ textTransform: 'capitalize' }}>{p}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="config-group">
        <span className="config-label">Density (--ig-size)</span>
        <div className="config-row">
          {SIZES.map((s) => (
            <button key={s} className={`swatch ${size === s ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setSize(s)}>
              {SIZE_LABEL[s]}
            </button>
          ))}
        </div>
        <span className="config-note">
          Adjusts row height and padding across every grid and Ignite UI component simultaneously.
        </span>
      </div>

      <div className="config-meta">
        Live feed driving <b>{quotes.length}</b> symbols · <b>{positions.length}</b> open positions ·{' '}
        <b>{orders.length.toLocaleString()}</b> orders. Theme &amp; density swap the Ignite UI base, grid and Dock Manager
        stylesheets at runtime — selection persists across reloads.
      </div>
    </div>
  );
}
