import type { IgrCellTemplateContext } from 'igniteui-react-grids';

// Shared formatting + conditional-style helpers used by every grid so that
// green/red coloring, trend arrows and number formatting stay consistent.

export type CellCtx = { dataContext: IgrCellTemplateContext };

/**
 * Shared IgrGrid `onRowClick` handler factory. The grid dispatches a
 * CustomEvent whose `detail.row.data` is the bound row; we forward its symbol
 * to the linked selection state.
 */
export function rowSymbolClick(onSymbol: (symbol: string) => void) {
  return (e: CustomEvent) => {
    const sym = (e?.detail?.row?.data as { symbol?: string } | undefined)?.symbol;
    if (sym) onSymbol(sym);
  };
}

const num = (v: number, d = 2) =>
  v?.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) ?? '';

export const fmtPrice = (v: number) => num(v, 2);
export const fmtInt = (v: number) => Math.round(v ?? 0).toLocaleString('en-US');
export const fmtSignedPct = (v: number) => `${v > 0 ? '+' : ''}${num(v, 2)}%`;
export const fmtSigned = (v: number) => `${v > 0 ? '+' : ''}${num(v, 2)}`;
export const fmtCompact = (v: number) =>
  Math.abs(v) >= 1e9
    ? `${(v / 1e9).toFixed(2)}B`
    : Math.abs(v) >= 1e6
      ? `${(v / 1e6).toFixed(2)}M`
      : Math.abs(v) >= 1e3
        ? `${(v / 1e3).toFixed(1)}K`
        : `${v}`;
export const fmtTime = (d: Date) =>
  d?.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) ?? '';

const upColor = 'var(--app-gain)';
const downColor = 'var(--app-loss)';
const flatColor = 'var(--app-text-muted)';

/** Resolve a CSS color string from a signed number. */
export const signColor = (v: number) => (v > 0 ? upColor : v < 0 ? downColor : flatColor);

/**
 * cellStyles object that colors text by the sign of the cell value and adds a
 * faint gain/loss background tint. Reused across change / %change / P&L columns.
 */
export const signedCellStyles = {
  color: (_r: unknown, _k: string, value: number) => signColor(Number(value)),
  background: (_r: unknown, _k: string, value: number) =>
    Number(value) > 0 ? 'var(--app-gain-soft)' : Number(value) < 0 ? 'var(--app-loss-soft)' : 'transparent',
  'font-variant-numeric': () => 'tabular-nums',
  'font-weight': () => '600',
};

/** Lighter variant — colored text, no background tint. */
export const signedTextStyles = {
  color: (_r: unknown, _k: string, value: number) => signColor(Number(value)),
  'font-variant-numeric': () => 'tabular-nums',
  'font-weight': () => '600',
};

export const monoStyles = {
  'font-variant-numeric': () => 'tabular-nums',
  'font-family': () => 'var(--app-mono)',
};

const arrow = (v: number) => (v > 0 ? '▲' : v < 0 ? '▼' : '·');

/** Template: signed value prefixed with a trend arrow, colored by sign. */
export function arrowSignedTemplate(format: (v: number) => string) {
  return function Tmpl(props: CellCtx) {
    const v = Number(props.dataContext.cell.value);
    return (
      <span style={{ color: signColor(v), fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
        <span style={{ fontSize: '0.66em', marginRight: 4, opacity: 0.9 }}>{arrow(v)}</span>
        {format(v)}
      </span>
    );
  };
}

/** Template: a colored pill for categorical values (side / status). */
export function pillTemplate(colorMap: Record<string, string>) {
  return function Tmpl(props: CellCtx) {
    const val = String(props.dataContext.cell.value ?? '');
    const c = colorMap[val] ?? 'var(--app-text-muted)';
    return (
      <span
        style={{
          color: c,
          border: `1px solid ${c}`,
          borderRadius: 4,
          padding: '1px 7px',
          fontSize: '0.72em',
          fontWeight: 700,
          letterSpacing: '0.03em',
          background: 'color-mix(in srgb, currentColor 12%, transparent)',
          whiteSpace: 'nowrap',
        }}
      >
        {val.replace('_', ' ')}
      </span>
    );
  };
}

export const SIDE_COLORS: Record<string, string> = { BUY: 'var(--app-gain)', SELL: 'var(--app-loss)', LONG: 'var(--app-gain)', SHORT: 'var(--app-loss)' };
export const STATUS_COLORS: Record<string, string> = {
  FILLED: 'var(--app-gain)',
  PARTIAL: 'var(--app-accent)',
  WORKING: 'var(--app-text-muted)',
  CANCELLED: '#c98b2e',
  REJECTED: 'var(--app-loss)',
};
