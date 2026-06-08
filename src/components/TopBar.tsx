import { useMemo } from 'react';
import { useMarket } from '../state/MarketContext';
import { fmtPrice, fmtSignedPct } from './grid/cellRenderers';

// Top bar: brand, live synthetic indices, market clock, and a streaming
// ticker marquee. Each marquee item flashes when its price changes by keying
// the price span on the value — only changed items re-trigger the animation.

const TICKER_SYMBOLS = 56;

function IndexChip({ label, pct }: { label: string; pct: number }) {
  const cls = pct > 0 ? 'idx-up' : pct < 0 ? 'idx-down' : 'idx-flat';
  return (
    <div className="index-chip">
      <span className="index-label">{label}</span>
      <span className={`index-pct ${cls}`}>
        {pct > 0 ? '▲' : pct < 0 ? '▼' : '·'} {fmtSignedPct(pct)}
      </span>
    </div>
  );
}

export function TopBar() {
  const { quotes, tick, setSelected } = useMarket();

  // Synthetic indices from sector aggregates of the live feed.
  const indices = useMemo(() => {
    const by = (sectors: string[]) => {
      const subset = quotes.filter((q) => sectors.includes(q.sector));
      if (!subset.length) return 0;
      return subset.reduce((s, q) => s + q.changePct, 0) / subset.length;
    };
    return [
      { label: 'FT-COMPOSITE', pct: quotes.reduce((s, q) => s + q.changePct, 0) / (quotes.length || 1) },
      { label: 'FT-TECH 100', pct: by(['Technology', 'Communication']) },
      { label: 'FT-FINANCIALS', pct: by(['Financials']) },
      { label: 'FT-ENERGY', pct: by(['Energy', 'Materials', 'Utilities']) },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const clock = useMemo(
    () => new Date().toLocaleTimeString('en-US', { hour12: false }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  );

  const tape = useMemo(() => quotes.slice(0, TICKER_SYMBOLS), [quotes]);
  // Duplicate the tape so the marquee can loop seamlessly.
  const loop = useMemo(() => [...tape, ...tape], [tape]);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand">
          <span className="brand-mark">◆</span>
          <span className="brand-name">FIN<span className="brand-accent">TRADER</span></span>
          <span className="brand-sub">PRO TERMINAL</span>
        </div>
        <div className="index-strip">
          {indices.map((i) => (
            <IndexChip key={i.label} label={i.label} pct={i.pct} />
          ))}
        </div>
      </div>

      <div className="topbar-right">
        <div className="market-status">
          <span className="status-dot" />
          MARKET OPEN
        </div>
        <div className="clock" aria-label="market time">
          {clock} <span className="clock-tz">EST</span>
        </div>
      </div>

      <div className="ticker" aria-label="streaming ticker">
        <div className="ticker-track">
          {loop.map((q, i) => {
            const dirClass = q.tickDir > 0 ? 'flash-up' : q.tickDir < 0 ? 'flash-down' : '';
            const c = q.changePct > 0 ? 'cell-gain' : q.changePct < 0 ? 'cell-loss' : 'cell-flat';
            return (
              <button
                key={`${q.symbol}-${i}`}
                className="ticker-item"
                onClick={() => setSelected(q.symbol)}
                title={q.name}
              >
                <span className="ticker-sym">{q.symbol}</span>
                {/* keying on q.last re-triggers the flash only when price moves */}
                <span key={q.last} className={`ticker-last ${dirClass}`}>
                  {fmtPrice(q.last)}
                </span>
                <span className={`ticker-chg ${c}`}>
                  {q.changePct > 0 ? '▲' : q.changePct < 0 ? '▼' : '·'}
                  {fmtSignedPct(q.changePct)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
