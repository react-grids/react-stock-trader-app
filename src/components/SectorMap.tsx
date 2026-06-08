import { useMemo, useRef } from 'react';
import { IgrTreemap, type IgrTreemapNodePointerEventArgs } from 'igniteui-react-charts';
import { useMarket } from '../state/MarketContext';
import { useThemeColors } from '../theme/useThemeColors';

// A finviz-style sector heat-map. Tiles are grouped by sector and sized by
// trading volume; fill color runs red→neutral→green by % change. Clicking a
// leaf drives the shared selected-symbol so the chart / Level II / tape follow.

interface MapNode {
  id: string;
  parent: string | null;
  label: string;
  /** tile size — set on LEAVES only; parents omit it so the treemap sums children */
  value?: number;
  /** mapped onto the red→green fill scale */
  changePct: number;
  symbol?: string;
}

const ROOT = 'root';

export function SectorMap() {
  const { quotes, setSelected, tick } = useMarket();
  const c = useThemeColors();

  // Snapshot per-symbol tile sizes ONCE so volume growth doesn't re-flow the
  // layout every second — only the fill recolors with the live feed.
  const sizes = useRef<Map<string, number> | null>(null);
  if (sizes.current === null) {
    sizes.current = new Map(quotes.map((q) => [q.symbol, q.volume]));
  }

  // Throttle the heat-map recolor to ~3s. Rebinding dataSource resets the
  // treemap's drill-in zoom, so updating every tick would fight with sector
  // drill-down; every ~3 ticks keeps it live but navigable.
  const slowTick = Math.floor(tick / 3);

  const data = useMemo<MapNode[]>(() => {
    // Root + sector nodes omit `value` so the treemap sizes them by summing
    // their leaf children (an explicit 0 would collapse the whole layout).
    const nodes: MapNode[] = [{ id: ROOT, parent: null, label: 'Market', changePct: 0 }];

    // sector header nodes carry a volume-weighted average % change
    const sectorAgg = new Map<string, { vol: number; wsum: number }>();
    for (const q of quotes) {
      const a = sectorAgg.get(q.sector) ?? { vol: 0, wsum: 0 };
      a.vol += q.volume;
      a.wsum += q.changePct * q.volume;
      sectorAgg.set(q.sector, a);
    }
    for (const [sector, a] of sectorAgg) {
      nodes.push({ id: `sec:${sector}`, parent: ROOT, label: sector, changePct: a.vol ? a.wsum / a.vol : 0 });
    }

    for (const q of quotes) {
      nodes.push({
        id: `sym:${q.symbol}`,
        parent: `sec:${q.sector}`,
        label: q.symbol,
        value: sizes.current!.get(q.symbol) ?? q.volume,
        changePct: q.changePct,
        symbol: q.symbol,
      });
    }
    return nodes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slowTick]);

  // red → neutral(border) → green, anchored at ±3% so typical moves spread the scale
  const fillBrushes = useMemo(() => [c.loss, c.border, c.gain], [c.loss, c.border, c.gain]);

  const handlePressed = (_s: IgrTreemap, e: IgrTreemapNodePointerEventArgs) => {
    const sym = (e?.item as { symbol?: string } | undefined)?.symbol;
    if (sym) setSelected(sym);
  };

  const up = quotes.filter((q) => q.changePct > 0).length;
  const down = quotes.filter((q) => q.changePct < 0).length;

  return (
    <div className="pane">
      <div className="pane-toolbar">
        <span className="pane-title">Sector Heat Map</span>
        <span className="pane-badge">vol-weighted</span>
        <span className="spacer" />
        <span style={{ color: 'var(--app-gain)' }}>▲ {up}</span>
        <span style={{ color: 'var(--app-loss)' }}>▼ {down}</span>
      </div>
      <div className="pane-body" style={{ background: c.surface }}>
        <IgrTreemap
          width="100%"
          height="100%"
          dataSource={data}
          idMemberPath="id"
          parentIdMemberPath="parent"
          labelMemberPath="label"
          valueMemberPath="value"
          customValueMemberPath="changePct"
          fillScaleMode="Value"
          fillScaleMinimumValue={-3}
          fillScaleMaximumValue={3}
          fillBrushes={fillBrushes}
          headerDisplayMode="Header"
          headerHeight={22}
          headerBackground={c.surface2}
          headerTextColor={c.textMuted}
          headerHoverBackground={c.surface2}
          headerHoverTextColor={c.text}
          outline={c.surface2}
          nodeOpacity={1}
          darkTextColor={c.text}
          nodePointerPressed={handlePressed}
        />
      </div>
    </div>
  );
}
