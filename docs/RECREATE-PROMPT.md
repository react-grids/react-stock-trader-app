# Recreate FinTrader Pro — The Complete Build Prompt & Specification

This document is everything you need to **recreate the FinTrader Pro trading workstation from scratch** — whether you're building it by hand or handing it to an AI coding agent (Claude Code, Cursor, Copilot, etc.). It contains the original brief, the strict acceptance criteria, the data model, the Ignite UI APIs used, and a recommended build order with the gotchas you'll hit.

> Companion to the main [README](../README.md). The README explains *what* the app is; this doc explains *how to build it*.

---

## 1. The one‑shot prompt

Paste the following into an AI agent working in an empty **Vite + React + TypeScript** project that has the **Ignite UI for React** MCP server / skills available:

> Build a **dark fintech trader workstation** in React + Ignite UI (`igniteui-react`). Use the Ignite UI MCP servers / skills.
>
> **Packages:** `igniteui-react-grids`, `igniteui-react-charts`, `igniteui-react-dockmanager`.
>
> **All grids in the app must be Ignite UI React grids — no custom grids, no div‑grids.**
>
> **Shell:** `IgrDockManager` (themed — apply a dark/light theme class and match its `--igc-*` chrome vars to the app palette; ensure all grid background/color matches the DockManager dark theme), dense panes:
> - **Watchlist** (`IgrGrid`) + **Positions** / **Config** tabs (left) — at least **200 items** in the watchlist and **1,000 orders**.
> - Candlestick `IgrFinancialChart` over a grouped **Order Blotter** (center).
> - **Market Data** / **Top Movers** tabs over **Level II** / **Time & Sales** tabs (right).
>
> **Grids:** green/red conditional cell coloring (`cellStyles`) on change / % / P&L, trend arrows, row grouping, paging. Mock data only.
>
> **Linked / interactive:** a selected‑symbol state shared across panes — clicking a row in the Watchlist or Market Data updates the chart, Level II, and Time & Sales to that symbol.
>
> **Top bar:** streaming ticker (marquee + flash, live mock ticks ~1s).
>
> **Live feed (shared context)** drives the watchlist %‑change coloring.
>
> **Config pane switches:** Light/Dark × Material/Bootstrap/Fluent/Indigo (swap the theme CSS at runtime, including the dock‑manager theme) + density Small/Medium/Large (`--ig-size`).
>
> **Bonus — Sector heat‑map:** add an `IgrTreemap` (from `igniteui-react-charts`) as a docked tab alongside the Watchlist. Group symbols by sector, size tiles by volume, and color them red→green by % change (fintech style). Clicking a tile drives the shared selected‑symbol. Theme it to the app palette.
>
> Dark, dense, max data per pane. Make all data related/linked for interactions. UX is a priority — this needs to be visually stunning, functional, and real‑life.
>
> **Styling acceptance criteria (strict):** see §3 below.

---

## 2. Functional requirements

| # | Requirement |
| --- | --- |
| F1 | A dockable shell using `IgrDockManager` with three columns and tabbed panes. Every pane is draggable, floatable, pinnable, tabbable, resizable. |
| F2 | Watchlist `IgrGrid` with **≥ 200 symbols** (we ship 232 across 10 sectors). |
| F3 | Order Blotter `IgrGrid` with **1,000 orders**, **row grouping** (sector/status/side), and **paging**. |
| F4 | Candlestick `IgrFinancialChart` with OHLC + volume; supports Candle/Bar/Line. |
| F5 | Level II depth ladder **as an `IgrGrid`** (not a div ladder) with green bid / red ask and depth bars. |
| F6 | Time & Sales print tape **as an `IgrGrid`**, colored by aggressor side. |
| F7 | Positions `IgrGrid` grouped by sector with live P&L. |
| F8 | Market Data + Top Movers grids (gainers/losers/most‑active). |
| F9 | A **shared selected‑symbol** state. Clicking any symbol row updates chart + Level II + Time & Sales. |
| F10 | A **streaming ticker marquee** in the top bar with per‑item flash on price change, ~1s cadence. |
| F11 | A **live feed context** ticking ~1s that drives watchlist %‑change coloring and the marquee. |
| F12 | A **Config pane** to switch Light/Dark × Material/Bootstrap/Fluent/Indigo and density (S/M/L) at runtime. |
| F13 | Conditional `cellStyles` (green/red) + trend arrows on change / %change / P&L across grids. |
| F14 | Mock data only — no backend. Prefer a seeded PRNG so data is stable across reloads. |
| F15 | **Bonus:** a sector heat‑map (`IgrTreemap`) as a docked tab beside the Watchlist — tiles grouped by sector, sized by volume, colored red→green by % change, clickable to drive the shared selection. |

---

## 3. Strict styling acceptance criteria

These are **non‑negotiable** and are the difference between "looks like a demo" and "looks like a terminal":

- **Theme cohesion is mandatory** across all panes/components.
- **Do NOT use default black or default library colors** unless explicitly requested.
- For Ignite UI grids, set and verify these theme tokens:
  - `--ig-grid-background`
  - `--ig-grid-content-background`
  - `--ig-grid-row-odd-background`
  - `--ig-grid-row-even-background`
  - `--ig-grid-header-background`
  - `--ig-grid-row-hover-background`
- **Odd/even row backgrounds must be identical** unless zebra striping is explicitly requested.
- **Scrollbars must be palette‑matched** across DockManager, grids, and native browser scrollbars (no bright‑blue defaults).
- **Charts must match the app theme too:**
  - chart plot background matches the pane background,
  - axis label / gridline colors match text‑muted / border tokens,
  - volume pane and zoom‑slider colors are theme‑aligned,
  - bullish/bearish candle colors use the app gain/loss tokens.
- Before final output, do a **visual pass** and fix any off‑theme surfaces, stripes, chart panels, or scrollbars.

---

## 4. Data model (mock)

Generate everything client‑side from a seeded PRNG (`mulberry32`) so the universe is deterministic.

```ts
interface Quote {            // one per symbol; mutated in place by the feed
  symbol, name, sector;
  last, prevClose, open, high, low, bid, ask, bidSize, askSize, volume;
  change, changePct;
  tickDir: -1 | 0 | 1;       // last tick direction → flashing/coloring
}
interface Position { id, symbol, name, sector, side, qty, avgPrice, last, marketValue, unrealized, unrealizedPct, dayPnl }
interface Order   { id, time, symbol, sector, side, type, status, tif, qty, filled, limitPrice, avgFillPrice, notional, trader, venue }
interface DepthLevel { price, size, cumulative, orders }
interface OrderBook  { symbol, bids: DepthLevel[], asks: DepthLevel[] }
interface Print   { id, time, symbol, price, size, side, cond }
interface Candle  { date, open, high, low, close, volume }
```

- **Universe:** ~120 real tickers across 10 sectors, padded with synthetic names to **232+**.
- **Orders:** 1,000, weighted status distribution (mostly FILLED/WORKING), spread across the trailing session.
- **Candles:** ~320 daily bars per symbol, seeded from the symbol string, weekends skipped.
- **Order book:** ~14 levels each side, cumulative depth for the depth bars.
- **Prints:** rolling tape, newest first, capped (~80).

---

## 5. Ignite UI API cheat‑sheet (React)

**Module registration** (call once at startup):

```ts
import { IgrGridModule, IgrPaginatorModule } from 'igniteui-react-grids';
import { IgrFinancialChartModule, IgrTreemapModule } from 'igniteui-react-charts';
[IgrGridModule, IgrPaginatorModule].forEach(m => m.register());
IgrFinancialChartModule.register();
IgrTreemapModule.register();
// IgrDockManager auto-registers.
```

**Dock Manager** — set `layout` imperatively via a ref; match content `slot` to pane `contentId`:

```tsx
<IgrDockManager ref={dockRef}>
  <div slot="content-watchlist"><Watchlist/></div>
  …
</IgrDockManager>
// dockRef.current.layout = { rootPane: { type: splitPane, orientation, panes:[…] } }
```

Pane types: `IgrDockManagerPaneType.{contentPane,splitPane,tabGroupPane,documentHost}`, orientation `IgrSplitPaneOrientation.{horizontal,vertical}`. Theme via `--igc-*` CSS vars + `dark-theme`/`light-theme` class on an ancestor.

**Grid** — conditional styling + grouping + paging:

```tsx
<IgrGrid data={rows} autoGenerate={false} primaryKey="id"
         rowSelection="single" hideRowSelectors      // hide bright default checkboxes
         groupingExpressions={[{ fieldName:'sector', dir: SortingDirection.Asc }]}
         onRowClick={(e: CustomEvent) => setSelected(e.detail.row.data.symbol)}>
  <IgrColumn field="changePct" dataType="number" sortable
             cellStyles={{ color:(r,k,v)=> v>0?'var(--app-gain)':'var(--app-loss)' }}
             bodyTemplate={(p)=> <span>{p.dataContext.cell.value}</span>} />
  <IgrPaginator perPage={100} />
</IgrGrid>
```

- `cellStyles` callback signature: `(rowData, columnKey, cellValue, rowIndex) => value`.
- Cell template prop is `bodyTemplate`; the render fn receives `{ dataContext }` with `dataContext.cell.value` and `dataContext.cell.row.data`.
- `onRowClick` is a single‑arg `(e: CustomEvent)` — row data is at `e.detail.row.data`.

**Treemap (sector heat‑map)** — flat hierarchy, value‑scaled fill, classic `(sender, args)` events:

```tsx
<IgrTreemap dataSource={nodes} width="100%" height="100%"
  idMemberPath="id" parentIdMemberPath="parent" labelMemberPath="label"
  valueMemberPath="value"            // tile SIZE (volume) — LEAVES only
  customValueMemberPath="changePct"  // mapped to the fill scale
  fillScaleMode="Value" fillScaleMinimumValue={-3} fillScaleMaximumValue={3}
  fillBrushes={[loss, neutral, gain]}  // red → neutral → green
  headerDisplayMode="Header" headerBackground={surface2} headerTextColor={muted}
  nodePointerPressed={(s, e) => e.item?.symbol && setSelected(e.item.symbol)} />
```

- Data is a **flat array**: one root (`parent: null`), sector parents (`parent: 'root'`), and symbol leaves (`parent: 'sec:<Sector>'`).
- **Parent/root nodes must OMIT `value`** so the treemap sums their children; an explicit `0` collapses the whole layout to nothing.
- Chart events use the **`(sender, args)`** signature (unlike the grids' single‑arg `CustomEvent`). The clicked data item is `e.item`.
- Canvas‑painted → theme via **props** (`fillBrushes`, `headerBackground`, `headerTextColor`, `outline`, `darkTextColor`); resolve CSS vars to concrete colors via `useThemeColors`.

**Financial chart** — themable via props for the canvas; CSS for the toolbar:

```tsx
<IgrFinancialChart dataSource={candles} chartType="Candle"
  brushes={gain} outlines={gain} negativeBrushes={loss} negativeOutlines={loss}
  volumeType="Column" volumeBrushes={accentRgba}
  zoomSliderType="None" /> {/* slider handles have no color API → disable */}
```

---

## 6. Theming architecture (build it this way)

1. **`themeRegistry.ts`** — import all 8 web‑components themes and 8 grid themes via Vite `?url`, map them by `(variant, palette)`, and `applyTheme()` swaps the active `<link href>`, sets `data-variant`/`data-palette` on `<html>`, sets `--ig-size`, and toggles `dark-theme`/`light-theme`.
2. **`palette.css`** — one semantic palette keyed on `[data-variant]`/`[data-palette]` that maps **all** grid `--ig-grid-*`, dock `--igc-*`, scrollbar (`--igc-sb-*` + `::-webkit-scrollbar`), and gain/loss tokens. Keep odd/even rows identical.
3. **`ThemeContext.tsx`** — hold `{variant, palette, size}`; **apply the theme in render (via `useMemo`), not in an effect**, so descendants (the canvas chart) never read stale CSS vars on a switch. Persist to `localStorage`.
4. **`useThemeColors.ts`** — resolve the palette CSS vars to concrete colors (via `getComputedStyle`) for the canvas chart, re‑resolving when variant/palette changes.

**Financial chart re‑skin:** the chart's toolbar / range selector / type & indicator menus / legend are **light‑DOM HTML with a hard‑coded light theme** (`.financialChart*`, `.ui-*`). Re‑skin them with **scoped CSS** under `.chart-wrap`. Theme the canvas via props. If the zoom slider can't match the palette, **disable it** (`zoomSliderType="None"`).

---

## 7. Recommended build order

1. **Theme system** — `themeRegistry.ts`, `palette.css`, `ThemeContext.tsx`, `useThemeColors.ts`. Get the dark palette + token mapping right first; everything inherits from it.
2. **Data layer** — `rng.ts`, `types.ts`, `symbols.ts` (232 symbols), `generators.ts` (quotes, 1,000 orders, candles, book, prints).
3. **State** — `MarketContext.tsx`: seeded universe + ~1s tick loop + shared `selected` symbol + derived live views.
4. **Shared grid helpers** — `cellRenderers.tsx`: formatters, `cellStyles` objects, arrow templates, side/status pill templates, the `onRowClick` factory.
5. **Panes** — TopBar (ticker), Watchlist, SectorMap (treemap), Positions, ChartPane, OrderBlotter, MarketGrid, LevelII, TimeAndSales, ConfigPane.
6. **Shell** — `Workstation.tsx` with the `IgrDockManager` layout; wire it into the route.
7. **Register modules + import theme CSS** in `main.tsx`, wrap with `<ThemeProvider><MarketProvider>`.
8. **Verify** — typecheck, build, run, and do the visual theme pass against the strict criteria.

---

## 8. Gotchas you will hit (and the fixes)

| Symptom | Cause | Fix |
| --- | --- | --- |
| `TS7016: Could not find a declaration file for 'igniteui-react-grids' / '…-dockmanager'` | The packages' `typings`/`exports.types` point to a root `*.d.ts` that doesn't exist | Add `compilerOptions.paths` (+ `baseUrl`) mapping each to `node_modules/<pkg>/src/<entry>.d.ts` |
| `vite build` fails in lightningcss with `Unexpected token Number … 50` | A shipped grid‑theme CSS has a malformed `var(--ig-gray 50-0.8-contrast)` token | Set `build.cssMinify: false` in `vite.config.ts` |
| Dock theme CSS import fails | `exports` field gates the path | Import `igniteui-dockmanager/themes/igc.themes.css` (not `/styles/...`) |
| Bright **magenta** row‑selection checkboxes | Grid default selection accent | Add `hideRowSelectors` (keeps selection highlight) |
| Chart plot stays dark after switching to a light theme | `useThemeColors` read CSS vars before the theme attribute was applied (effect timing) | Apply the theme in **render** via `useMemo`, not in an effect |
| Chart toolbar is a light‑gray bar | Light‑DOM HTML with a hard‑coded light theme | Re‑skin `.financialChart*` / `.ui-*` with scoped CSS |
| Chart `color-mix(...)` brushes don't paint | Canvas can't parse CSS color functions | Resolve to concrete `rgba()` before passing as a brush |
| Treemap renders nothing (empty canvas) | Parent/root nodes have an explicit `value: 0`, so the layout sums to zero | Omit `value` on parent/root nodes — let the treemap sum the leaves |
| Treemap drill‑in resets every second | Rebinding `dataSource` each tick resets the zoom state | Throttle the live recolor (e.g. rebuild every ~3 ticks) and snapshot tile sizes once |

---

## 9. Definition of done

- [ ] `npx tsc -b` passes; `npm run build` succeeds.
- [ ] App runs at `http://localhost:3003` with **zero console errors**.
- [ ] Dock manager renders 3 columns; all panes drag/float/pin/tab.
- [ ] Watchlist shows **≥ 200** symbols; Order Blotter shows **1,000** orders, grouped + paged.
- [ ] Candlestick chart renders with volume; type switching works.
- [ ] Sector heat‑map (`IgrTreemap`) renders grouped, volume‑sized, red→green tiles; clicking a tile selects the symbol.
- [ ] Clicking a symbol row (or heat‑map tile) updates the chart, Level II, and Time & Sales (verified).
- [ ] Ticker marquee streams and flashes ~1s.
- [ ] Theme switching (Light/Dark × 4 palettes) and density (S/M/L) work at runtime and persist.
- [ ] Visual pass passes every item in §3 — no off‑theme surfaces, no zebra, no bright scrollbars, themed chart.

---

*Mock data only. Not investment advice. Ignite UI for React is a commercial Infragistics product.*
