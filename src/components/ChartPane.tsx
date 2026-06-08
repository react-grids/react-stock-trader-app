import { useMemo, useState } from 'react';
import { IgrFinancialChart } from 'igniteui-react-charts';
import { useMarket } from '../state/MarketContext';
import { useThemeColors } from '../theme/useThemeColors';
import { fmtCompact, fmtPrice, fmtSigned, fmtSignedPct, signColor } from './grid/cellRenderers';

type ChartKind = 'Candle' | 'Bar' | 'Line';
const KINDS: ChartKind[] = ['Candle', 'Bar', 'Line'];

// Canvas brushes need concrete colors, so convert resolved #rrggbb to rgba().
function rgba(hex: string, a: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export function ChartPane() {
  const { candles, selected, quoteMap } = useMarket();
  const c = useThemeColors();
  const [kind, setKind] = useState<ChartKind>('Candle');
  const q = quoteMap.get(selected);

  // translucent volume + overlay derived from the live palette
  const volumeBrush = useMemo(() => rgba(c.accent, 0.38), [c.accent]);
  const overlayFill = useMemo(() => rgba(c.gain, 0.14), [c.gain]);
  const overlayLine = useMemo(() => rgba(c.gain, 0.4), [c.gain]);

  return (
    <div className="pane">
      <div className="quote-head">
        <div>
          <span className="qh-sym">{selected}</span>{' '}
          <span className="qh-name">{q?.name}</span>
        </div>
        <span className="qh-last" style={{ color: signColor(q?.tickDir ?? 0) }}>{fmtPrice(q?.last ?? 0)}</span>
        <span className="qh-chg" style={{ color: signColor(q?.change ?? 0) }}>
          {(q?.change ?? 0) > 0 ? '▲' : (q?.change ?? 0) < 0 ? '▼' : '·'} {fmtSigned(q?.change ?? 0)} ({fmtSignedPct(q?.changePct ?? 0)})
        </span>
        <div className="qh-stat"><span className="k">Open</span><span className="v">{fmtPrice(q?.open ?? 0)}</span></div>
        <div className="qh-stat"><span className="k">High</span><span className="v">{fmtPrice(q?.high ?? 0)}</span></div>
        <div className="qh-stat"><span className="k">Low</span><span className="v">{fmtPrice(q?.low ?? 0)}</span></div>
        <div className="qh-stat"><span className="k">Prev</span><span className="v">{fmtPrice(q?.prevClose ?? 0)}</span></div>
        <div className="qh-stat"><span className="k">Vol</span><span className="v">{fmtCompact(q?.volume ?? 0)}</span></div>
        <span className="spacer" style={{ flex: 1 }} />
        <div className="seg">
          {KINDS.map((k) => (
            <button key={k} className={k === kind ? 'active' : ''} onClick={() => setKind(k)}>{k}</button>
          ))}
        </div>
      </div>
      <div className="chart-wrap" style={{ background: c.surface, color: c.textMuted }}>
        <IgrFinancialChart
          width="100%"
          height="100%"
          dataSource={candles}
          chartType={kind}
          chartTitle=""
          yAxisMode="Numeric"
          // bullish / bearish candles use the app gain/loss tokens
          brushes={c.gain}
          outlines={c.gain}
          negativeBrushes={c.loss}
          negativeOutlines={c.loss}
          thickness={1.5}
          // volume pane themed to the accent
          volumeType="Column"
          volumeBrushes={volumeBrush}
          volumeOutlines={volumeBrush}
          volumeThickness={1}
          // The zoom-slider navigator's shade + handles are canvas-painted with
          // a hard-coded light theme and expose no color API, so it can't match
          // the palette — disable it. Range selection stays available via the
          // toolbar (1M/3M/6M/ALL).
          zoomSliderType="None"
          // overlays / trend band tinted with gain
          overlayBrushes={overlayFill}
          overlayOutlines={overlayLine}
          overlayThickness={1}
        />
      </div>
    </div>
  );
}
