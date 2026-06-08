import { useMemo, useState } from 'react';
import { IgrColumn, IgrGrid, IgrPaginator, SortingDirection } from 'igniteui-react-grids';
import { useMarket } from '../state/MarketContext';
import {
  fmtInt,
  fmtPrice,
  fmtTime,
  monoStyles,
  pillTemplate,
  SIDE_COLORS,
  STATUS_COLORS,
  type CellCtx,
} from './grid/cellRenderers';

const SideCell = pillTemplate(SIDE_COLORS);
const StatusCell = pillTemplate(STATUS_COLORS);

type GroupKey = 'sector' | 'status' | 'side' | 'none';
const GROUPS: { key: GroupKey; label: string }[] = [
  { key: 'sector', label: 'Sector' },
  { key: 'status', label: 'Status' },
  { key: 'side', label: 'Side' },
  { key: 'none', label: 'Flat' },
];

const timeCell = (p: CellCtx) => <span className="cell-num">{fmtTime(p.dataContext.cell.value as Date)}</span>;
const intCell = (p: CellCtx) => <span className="cell-num">{fmtInt(Number(p.dataContext.cell.value))}</span>;
const priceCell = (p: CellCtx) => {
  const v = p.dataContext.cell.value as number | null;
  return <span className="cell-num">{v == null ? '—' : fmtPrice(v)}</span>;
};

export function OrderBlotter() {
  const { orders } = useMarket();
  const [group, setGroup] = useState<GroupKey>('sector');

  const grouping = useMemo(
    () => (group === 'none' ? [] : [{ fieldName: group, dir: SortingDirection.Asc, ignoreCase: true }]),
    [group],
  );

  return (
    <div className="pane">
      <div className="pane-toolbar">
        <span className="pane-title">Order Blotter</span>
        <span className="pane-badge">{orders.length.toLocaleString()} orders</span>
        <span className="spacer" />
        <span style={{ marginRight: 4 }}>Group</span>
        <div className="seg">
          {GROUPS.map((g) => (
            <button key={g.key} className={g.key === group ? 'active' : ''} onClick={() => setGroup(g.key)}>{g.label}</button>
          ))}
        </div>
      </div>
      <div className="pane-body">
        <IgrGrid
          className="ig-grid-surface"
          data={orders}
          autoGenerate={false}
          primaryKey="id"
          height="100%"
          width="100%"
          groupingExpressions={grouping}
          hideGroupedColumns
          allowFiltering
          filterMode="excelStyleFilter"
        >
          <IgrColumn field="time" header="Time" width="92px" dataType="time" sortable bodyTemplate={timeCell} />
          <IgrColumn field="symbol" header="Symbol" width="92px" sortable groupable bodyTemplate={(p: CellCtx) => <span style={{ fontWeight: 700 }}>{String(p.dataContext.cell.value)}</span>} />
          <IgrColumn field="side" header="Side" width="80px" sortable groupable bodyTemplate={SideCell} />
          <IgrColumn field="type" header="Type" width="108px" sortable groupable />
          <IgrColumn field="status" header="Status" width="110px" sortable groupable bodyTemplate={StatusCell} />
          <IgrColumn field="qty" header="Qty" width="88px" dataType="number" sortable cellStyles={monoStyles} bodyTemplate={intCell} />
          <IgrColumn field="filled" header="Filled" width="88px" dataType="number" sortable cellStyles={monoStyles} bodyTemplate={intCell} />
          <IgrColumn field="limitPrice" header="Limit" width="92px" dataType="number" sortable bodyTemplate={priceCell} />
          <IgrColumn field="avgFillPrice" header="Avg Fill" width="96px" dataType="number" sortable bodyTemplate={priceCell} />
          <IgrColumn field="notional" header="Notional" width="124px" dataType="number" sortable cellStyles={monoStyles} bodyTemplate={priceCell} />
          <IgrColumn field="tif" header="TIF" width="70px" sortable groupable />
          <IgrColumn field="venue" header="Venue" width="86px" sortable groupable />
          <IgrColumn field="trader" header="Trader" width="110px" sortable groupable />
          <IgrColumn field="sector" header="Sector" width="120px" sortable groupable />
          <IgrPaginator perPage={100} />
        </IgrGrid>
      </div>
    </div>
  );
}
