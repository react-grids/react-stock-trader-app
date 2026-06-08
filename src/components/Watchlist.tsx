import { useDeferredValue, useMemo, useState } from 'react';
import { IgrColumn, IgrGrid, IgrPaginator } from 'igniteui-react-grids';
import { useMarket } from '../state/MarketContext';
import { ALL_SECTORS } from '../data/symbols';
import {
  arrowSignedTemplate,
  fmtCompact,
  fmtPrice,
  fmtSigned,
  fmtSignedPct,
  monoStyles,
  rowSymbolClick,
  signColor,
  signedCellStyles,
  signedTextStyles,
  type CellCtx,
} from './grid/cellRenderers';

// Last-price cell: colored by the latest tick direction with a trend arrow.
function LastCell(props: CellCtx) {
  const row = props.dataContext.cell.row?.data as { last: number; tickDir: number } | undefined;
  const v = Number(props.dataContext.cell.value);
  const dir = row?.tickDir ?? 0;
  return (
    <span style={{ color: signColor(dir), fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--app-mono)' }}>
      <span style={{ fontSize: '0.66em', marginRight: 4, opacity: 0.85 }}>
        {dir > 0 ? '▲' : dir < 0 ? '▼' : '·'}
      </span>
      {fmtPrice(v)}
    </span>
  );
}

function SymbolCell(props: CellCtx) {
  return <span style={{ fontWeight: 700, color: 'var(--app-text)', letterSpacing: '0.02em' }}>{String(props.dataContext.cell.value)}</span>;
}

const ChgPctCell = arrowSignedTemplate(fmtSignedPct);

export function Watchlist() {
  const { quotes, setSelected, selected } = useMarket();
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState<string>('All');
  const deferredQuery = useDeferredValue(query);

  const rows = useMemo(() => {
    const q = deferredQuery.trim().toUpperCase();
    return quotes.filter(
      (r) =>
        (sector === 'All' || r.sector === sector) &&
        (q === '' || r.symbol.includes(q) || r.name.toUpperCase().includes(q)),
    );
  }, [quotes, deferredQuery, sector]);

  return (
    <div className="pane">
      <div className="pane-toolbar">
        <span className="pane-title">Watchlist</span>
        <span className="pane-badge">{rows.length}</span>
        <span className="spacer" />
        <select className="pane-search" value={sector} onChange={(e) => setSector(e.target.value)} aria-label="sector filter">
          <option value="All">All sectors</option>
          {ALL_SECTORS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          className="pane-search"
          placeholder="Filter symbol…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="symbol search"
        />
      </div>
      <div className="pane-body">
        <IgrGrid
          className="ig-grid-surface"
          data={rows}
          autoGenerate={false}
          primaryKey="symbol"
          height="100%"
          width="100%"
          rowSelection="single"
          hideRowSelectors
          selectedRows={[selected]}
          onRowClick={rowSymbolClick(setSelected)}
          allowFiltering={false}
        >
          <IgrColumn field="symbol" header="Sym" width="78px" sortable bodyTemplate={SymbolCell} />
          <IgrColumn field="last" header="Last" width="100px" dataType="number" sortable bodyTemplate={LastCell} />
          <IgrColumn field="change" header="Chg" width="92px" dataType="number" sortable cellStyles={signedTextStyles} bodyTemplate={arrowSignedTemplate(fmtSigned)} />
          <IgrColumn field="changePct" header="Chg %" width="96px" dataType="number" sortable cellStyles={signedCellStyles} bodyTemplate={ChgPctCell} />
          <IgrColumn field="bid" header="Bid" width="82px" dataType="number" cellStyles={monoStyles} />
          <IgrColumn field="ask" header="Ask" width="82px" dataType="number" cellStyles={monoStyles} />
          <IgrColumn field="volume" header="Volume" width="96px" dataType="number" sortable cellStyles={monoStyles} bodyTemplate={(p: CellCtx) => <span className="cell-num">{fmtCompact(Number(p.dataContext.cell.value))}</span>} />
          <IgrColumn field="sector" header="Sector" width="120px" sortable groupable />
          <IgrPaginator perPage={50} />
        </IgrGrid>
      </div>
    </div>
  );
}
