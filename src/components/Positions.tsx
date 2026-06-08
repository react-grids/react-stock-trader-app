import { useMemo } from 'react';
import { IgrColumn, IgrGrid, SortingDirection } from 'igniteui-react-grids';
import { useMarket } from '../state/MarketContext';
import {
  arrowSignedTemplate,
  fmtInt,
  fmtPrice,
  fmtSigned,
  fmtSignedPct,
  monoStyles,
  pillTemplate,
  rowSymbolClick,
  SIDE_COLORS,
  signColor,
  signedCellStyles,
  signedTextStyles,
  type CellCtx,
} from './grid/cellRenderers';

const SideCell = pillTemplate(SIDE_COLORS);
const moneyTemplate = (p: CellCtx) => <span className="cell-num">{fmtPrice(Number(p.dataContext.cell.value))}</span>;

// Group positions by sector so the blotter rolls up exposure per sector.
const grouping = [{ fieldName: 'sector', dir: SortingDirection.Asc, ignoreCase: true }];

export function Positions() {
  const { positions, setSelected, selected } = useMarket();

  const totals = useMemo(() => {
    const unreal = positions.reduce((s, p) => s + p.unrealized, 0);
    const day = positions.reduce((s, p) => s + p.dayPnl, 0);
    const mv = positions.reduce((s, p) => s + p.marketValue, 0);
    return { unreal, day, mv };
  }, [positions]);

  return (
    <div className="pane">
      <div className="pane-toolbar">
        <span className="pane-title">Positions</span>
        <span className="pane-badge">{positions.length}</span>
        <span className="spacer" />
        <span>MV&nbsp;<b className="cell-num" style={{ color: 'var(--app-text)' }}>{fmtPrice(totals.mv)}</b></span>
        <span>Day&nbsp;<b className="cell-num" style={{ color: signColor(totals.day) }}>{fmtSigned(totals.day)}</b></span>
        <span>uP&L&nbsp;<b className="cell-num" style={{ color: signColor(totals.unreal) }}>{fmtSigned(totals.unreal)}</b></span>
      </div>
      <div className="pane-body">
        <IgrGrid
          className="ig-grid-surface"
          data={positions}
          autoGenerate={false}
          primaryKey="id"
          height="100%"
          width="100%"
          rowSelection="single"
          hideRowSelectors
          selectedRows={positions.filter((p) => p.symbol === selected).map((p) => p.id)}
          groupingExpressions={grouping}
          hideGroupedColumns
          onRowClick={rowSymbolClick(setSelected)}
        >
          <IgrColumn field="symbol" header="Sym" width="80px" sortable bodyTemplate={(p: CellCtx) => <span style={{ fontWeight: 700 }}>{String(p.dataContext.cell.value)}</span>} />
          <IgrColumn field="side" header="Side" width="78px" sortable bodyTemplate={SideCell} />
          <IgrColumn field="qty" header="Qty" width="84px" dataType="number" sortable cellStyles={monoStyles} bodyTemplate={(p: CellCtx) => <span className="cell-num">{fmtInt(Number(p.dataContext.cell.value))}</span>} />
          <IgrColumn field="avgPrice" header="Avg" width="92px" dataType="number" sortable bodyTemplate={moneyTemplate} />
          <IgrColumn field="last" header="Last" width="92px" dataType="number" sortable bodyTemplate={moneyTemplate} />
          <IgrColumn field="marketValue" header="Mkt Val" width="116px" dataType="number" sortable bodyTemplate={moneyTemplate} />
          <IgrColumn field="dayPnl" header="Day P&L" width="108px" dataType="number" sortable cellStyles={signedTextStyles} bodyTemplate={arrowSignedTemplate(fmtSigned)} />
          <IgrColumn field="unrealized" header="uP&L" width="116px" dataType="number" sortable cellStyles={signedCellStyles} bodyTemplate={arrowSignedTemplate(fmtSigned)} />
          <IgrColumn field="unrealizedPct" header="uP&L %" width="100px" dataType="number" sortable cellStyles={signedCellStyles} bodyTemplate={arrowSignedTemplate(fmtSignedPct)} />
          <IgrColumn field="sector" header="Sector" width="130px" sortable groupable />
        </IgrGrid>
      </div>
    </div>
  );
}
