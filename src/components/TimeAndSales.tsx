import { IgrColumn, IgrGrid } from 'igniteui-react-grids';
import { useMarket } from '../state/MarketContext';
import { fmtInt, fmtPrice, fmtTime, pillTemplate, SIDE_COLORS, type CellCtx } from './grid/cellRenderers';

const SideCell = pillTemplate(SIDE_COLORS);

// Price colored by aggressor side (lift the offer = buy/green, hit the bid = sell/red).
const priceStyles = {
  color: (r: { side?: string }) => (r.side === 'BUY' ? 'var(--app-gain)' : r.side === 'SELL' ? 'var(--app-loss)' : 'var(--app-text)'),
  'font-weight': () => '700',
  'font-variant-numeric': () => 'tabular-nums',
};

const timeCell = (p: CellCtx) => <span className="cell-num">{fmtTime(p.dataContext.cell.value as Date)}</span>;
const sizeCell = (p: CellCtx) => <span className="cell-num">{fmtInt(Number(p.dataContext.cell.value))}</span>;
const priceCell = (p: CellCtx) => <span className="cell-num">{fmtPrice(Number(p.dataContext.cell.value))}</span>;

export function TimeAndSales() {
  const { prints, selected } = useMarket();

  return (
    <div className="pane">
      <div className="pane-toolbar">
        <span className="pane-title">Time &amp; Sales</span>
        <span className="sym-pill">{selected}</span>
        <span className="pane-badge">{prints.length} prints</span>
      </div>
      <div className="pane-body">
        <IgrGrid className="ig-grid-surface" data={prints} autoGenerate={false} primaryKey="id" height="100%" width="100%">
          <IgrColumn field="time" header="Time" width="30%" dataType="time" bodyTemplate={timeCell} />
          <IgrColumn field="price" header="Price" width="24%" dataType="number" cellStyles={priceStyles} bodyTemplate={priceCell} />
          <IgrColumn field="size" header="Size" width="24%" dataType="number" bodyTemplate={sizeCell} />
          <IgrColumn field="side" header="Side" width="22%" bodyTemplate={SideCell} />
        </IgrGrid>
      </div>
    </div>
  );
}
