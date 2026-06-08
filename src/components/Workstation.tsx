import { useEffect, useRef } from 'react';
import {
  IgrDockManager,
  IgrDockManagerPaneType,
  IgrSplitPaneOrientation,
  type IgrDockManagerLayout,
} from 'igniteui-react-dockmanager';
import { TopBar } from './TopBar';
import { Watchlist } from './Watchlist';
import { SectorMap } from './SectorMap';
import { Positions } from './Positions';
import { ConfigPane } from './ConfigPane';
import { ChartPane } from './ChartPane';
import { OrderBlotter } from './OrderBlotter';
import { MarketGrid } from './MarketGrid';
import { LevelII } from './LevelII';
import { TimeAndSales } from './TimeAndSales';

const contentPane = (contentId: string, header: string) => ({
  type: IgrDockManagerPaneType.contentPane,
  contentId,
  header,
});

const tabGroup = (panes: ReturnType<typeof contentPane>[]) => ({
  type: IgrDockManagerPaneType.tabGroupPane,
  panes,
});

// Three-column trading layout:
//   left  — Watchlist / Positions / Config tabs
//   center— Candlestick chart over the grouped Order Blotter
//   right — Market Data / Top Movers tabs over Level II / Time & Sales tabs
const LAYOUT: IgrDockManagerLayout = {
  rootPane: {
    type: IgrDockManagerPaneType.splitPane,
    orientation: IgrSplitPaneOrientation.horizontal,
    panes: [
      {
        type: IgrDockManagerPaneType.splitPane,
        orientation: IgrSplitPaneOrientation.vertical,
        size: 23,
        panes: [tabGroup([
          contentPane('content-watchlist', 'Watchlist'),
          contentPane('content-sectormap', 'Sector Map'),
          contentPane('content-positions', 'Positions'),
          contentPane('content-config', 'Config'),
        ])],
      },
      {
        type: IgrDockManagerPaneType.splitPane,
        orientation: IgrSplitPaneOrientation.vertical,
        size: 51,
        panes: [
          { ...contentPane('content-chart', 'Chart'), size: 62 },
          { ...contentPane('content-blotter', 'Order Blotter'), size: 38 },
        ],
      },
      {
        type: IgrDockManagerPaneType.splitPane,
        orientation: IgrSplitPaneOrientation.vertical,
        size: 26,
        panes: [
          {
            ...tabGroup([
              contentPane('content-market', 'Market Data'),
              contentPane('content-movers', 'Top Movers'),
            ]),
            size: 50,
          },
          {
            ...tabGroup([
              contentPane('content-levelii', 'Level II'),
              contentPane('content-tape', 'Time & Sales'),
            ]),
            size: 50,
          },
        ],
      },
    ],
  },
};

export function Workstation() {
  const dockRef = useRef<IgrDockManager>(null);

  useEffect(() => {
    if (dockRef.current) dockRef.current.layout = LAYOUT;
  }, []);

  return (
    <div className="workstation">
      <TopBar />
      <div className="dock-host">
        <IgrDockManager ref={dockRef}>
          <div slot="content-watchlist" className="slot-fill"><Watchlist /></div>
          <div slot="content-sectormap" className="slot-fill"><SectorMap /></div>
          <div slot="content-positions" className="slot-fill"><Positions /></div>
          <div slot="content-config" className="slot-fill"><ConfigPane /></div>
          <div slot="content-chart" className="slot-fill"><ChartPane /></div>
          <div slot="content-blotter" className="slot-fill"><OrderBlotter /></div>
          <div slot="content-market" className="slot-fill"><MarketGrid mode="all" /></div>
          <div slot="content-movers" className="slot-fill"><MarketGrid mode="movers" /></div>
          <div slot="content-levelii" className="slot-fill"><LevelII /></div>
          <div slot="content-tape" className="slot-fill"><TimeAndSales /></div>
        </IgrDockManager>
      </div>
    </div>
  );
}
