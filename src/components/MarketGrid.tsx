import { useMemo, useState } from 'react';
import { IgrColumn, IgrGrid, IgrPaginator } from 'igniteui-react-grids';
import { useMarket } from '../state/MarketContext';
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

function LastCell(props: CellCtx) {
  const row = props.dataContext.cell.row?.data as { tickDir?: number } | undefined;
  const dir = row?.tickDir ?? 0;
  return (
    <span style={{ color: signColor(dir), fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--app-mono)' }}>
      {fmtPrice(Number(props.dataContext.cell.value))}
    </span>
  );
}

type MoverMode = 'gainers' | 'losers' | 'active';

export function MarketGrid({ mode }: { mode: 'all' | 'movers' }) {
  const { quotes, setSelected, selected } = useMarket();
  const [movers, setMovers] = useState<MoverMode>('gainers');

  const rows = useMemo(() => {
    if (mode === 'all') return quotes;
    const copy = quotes.slice();
    if (movers === 'gainers') copy.sort((a, b) => b.changePct - a.changePct);
    else if (movers === 'losers') copy.sort((a, b) => a.changePct - b.changePct);
    else copy.sort((a, b) => b.volume - a.volume);
    return copy.slice(0, 40);
  }, [quotes, mode, movers]);

  return (
    <div className="pane">
      <div className="pane-toolbar">
        <span className="pane-title">{mode === 'all' ? 'Market Data' : 'Top Movers'}</span>
        <span className="pane-badge">{rows.length}</span>
        <span className="spacer" />
        {mode === 'movers' && (
          <div className="seg">
            <button className={movers === 'gainers' ? 'active' : ''} onClick={() => setMovers('gainers')}>Gainers</button>
            <button className={movers === 'losers' ? 'active' : ''} onClick={() => setMovers('losers')}>Losers</button>
            <button className={movers === 'active' ? 'active' : ''} onClick={() => setMovers('active')}>Most Active</button>
          </div>
        )}
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
        >
          <IgrColumn field="symbol" header="Sym" width="76px" sortable bodyTemplate={(p: CellCtx) => <span style={{ fontWeight: 700 }}>{String(p.dataContext.cell.value)}</span>} />
          <IgrColumn field="last" header="Last" width="92px" dataType="number" sortable bodyTemplate={LastCell} />
          <IgrColumn field="change" header="Chg" width="88px" dataType="number" sortable cellStyles={signedTextStyles} bodyTemplate={arrowSignedTemplate(fmtSigned)} />
          <IgrColumn field="changePct" header="Chg %" width="98px" dataType="number" sortable cellStyles={signedCellStyles} bodyTemplate={arrowSignedTemplate(fmtSignedPct)} />
          <IgrColumn field="high" header="High" width="86px" dataType="number" cellStyles={monoStyles} />
          <IgrColumn field="low" header="Low" width="86px" dataType="number" cellStyles={monoStyles} />
          <IgrColumn field="volume" header="Volume" width="98px" dataType="number" sortable cellStyles={monoStyles} bodyTemplate={(p: CellCtx) => <span className="cell-num">{fmtCompact(Number(p.dataContext.cell.value))}</span>} />
          {mode === 'all' && <IgrColumn field="sector" header="Sector" width="118px" sortable groupable />}
          {mode === 'all' && <IgrPaginator perPage={60} />}
        </IgrGrid>
      </div>
    </div>
  );
}
