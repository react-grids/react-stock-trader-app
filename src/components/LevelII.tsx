import { useMemo } from 'react';
import { IgrColumn, IgrGrid } from 'igniteui-react-grids';
import { useMarket } from '../state/MarketContext';
import { fmtInt, fmtPrice, type CellCtx } from './grid/cellRenderers';

interface LadderRow {
  level: number;
  bidSize: number;
  bidPrice: number;
  bidPctFromMax: number;
  askPrice: number;
  askSize: number;
  askPctFromMax: number;
}

const intCell = (p: CellCtx) => <span className="cell-num">{fmtInt(Number(p.dataContext.cell.value))}</span>;

// Depth-bar background: a horizontal bar whose width reflects this level's
// cumulative depth vs. the deepest level. Implemented via a cellStyles
// linear-gradient so it stays a true Ignite UI grid (no div ladder).
function bidBar(rowData: LadderRow) {
  const pct = Math.round(rowData.bidPctFromMax);
  return `linear-gradient(270deg, var(--app-gain-soft) 0 ${pct}%, transparent ${pct}% 100%)`;
}
function askBar(rowData: LadderRow) {
  const pct = Math.round(rowData.askPctFromMax);
  return `linear-gradient(90deg, var(--app-loss-soft) 0 ${pct}%, transparent ${pct}% 100%)`;
}

const bidSizeStyles = { background: (r: LadderRow) => bidBar(r), 'font-variant-numeric': () => 'tabular-nums' };
const askSizeStyles = { background: (r: LadderRow) => askBar(r), 'font-variant-numeric': () => 'tabular-nums' };
const bidPriceStyles = { color: () => 'var(--app-gain)', 'font-weight': () => '700', 'font-variant-numeric': () => 'tabular-nums' };
const askPriceStyles = { color: () => 'var(--app-loss)', 'font-weight': () => '700', 'font-variant-numeric': () => 'tabular-nums' };

export function LevelII() {
  const { book, selected, quoteMap } = useMarket();
  const q = quoteMap.get(selected);

  const rows = useMemo<LadderRow[]>(() => {
    const maxCum = Math.max(
      book.bids[book.bids.length - 1]?.cumulative ?? 1,
      book.asks[book.asks.length - 1]?.cumulative ?? 1,
    );
    const n = Math.min(book.bids.length, book.asks.length);
    return Array.from({ length: n }, (_, i) => ({
      level: i + 1,
      bidSize: book.bids[i].size,
      bidPrice: book.bids[i].price,
      bidPctFromMax: (book.bids[i].cumulative / maxCum) * 100,
      askPrice: book.asks[i].price,
      askSize: book.asks[i].size,
      askPctFromMax: (book.asks[i].cumulative / maxCum) * 100,
    }));
  }, [book]);

  const spread = q ? q.ask - q.bid : 0;

  return (
    <div className="pane">
      <div className="pane-toolbar">
        <span className="pane-title">Level II</span>
        <span className="sym-pill">{selected}</span>
        <span className="spacer" />
        <span>Spread <b className="cell-num" style={{ color: 'var(--app-text)' }}>{fmtPrice(spread)}</b></span>
        <span>Mid <b className="cell-num" style={{ color: 'var(--app-text)' }}>{fmtPrice(q ? (q.bid + q.ask) / 2 : 0)}</b></span>
      </div>
      <div className="pane-body">
        <IgrGrid className="ig-grid-surface" data={rows} autoGenerate={false} primaryKey="level" height="100%" width="100%">
          <IgrColumn field="bidSize" header="Bid Sz" width="33%" dataType="number" cellStyles={bidSizeStyles} bodyTemplate={intCell} />
          <IgrColumn field="bidPrice" header="Bid" width="17%" dataType="number" cellStyles={bidPriceStyles} />
          <IgrColumn field="askPrice" header="Ask" width="17%" dataType="number" cellStyles={askPriceStyles} />
          <IgrColumn field="askSize" header="Ask Sz" width="33%" dataType="number" cellStyles={askSizeStyles} bodyTemplate={intCell} />
        </IgrGrid>
      </div>
    </div>
  );
}
