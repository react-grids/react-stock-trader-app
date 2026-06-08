import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  buildCandles,
  buildOrderBook,
  buildOrders,
  buildPositions,
  buildPrints,
  buildQuotes,
} from '../data/generators';
import { mulberry32, noise } from '../data/rng';
import { UNIVERSE } from '../data/symbols';
import type { Candle, Order, OrderBook, Position, Print, Quote } from '../data/types';

interface MarketContextValue {
  quotes: Quote[];
  quoteMap: Map<string, Quote>;
  positions: Position[];
  orders: Order[];
  selected: string;
  setSelected: (symbol: string) => void;
  candles: Candle[];
  book: OrderBook;
  prints: Print[];
  /** bumped every feed tick so consumers can flash/animate */
  tick: number;
}

const MarketCtx = createContext<MarketContextValue | null>(null);

const round2 = (n: number) => Math.round(n * 100) / 100;
const baseOf = (symbol: string) => UNIVERSE.find((u) => u.symbol === symbol)?.base ?? 100;

/** Mutate one quote with a fresh random tick. Returns a new object. */
function tickQuote(q: Quote, rand: () => number): Quote {
  const vol = q.last * 0.0016;
  const delta = round2(noise(rand) * vol * 3);
  const last = round2(Math.max(0.5, q.last + delta));
  const change = round2(last - q.prevClose);
  const spread = Math.max(0.01, round2(last * 0.0004));
  return {
    ...q,
    last,
    change,
    changePct: round2((change / q.prevClose) * 100),
    high: round2(Math.max(q.high, last)),
    low: round2(Math.min(q.low, last)),
    bid: round2(last - spread),
    ask: round2(last + spread),
    bidSize: Math.max(100, q.bidSize + Math.round(noise(rand) * 600)),
    askSize: Math.max(100, q.askSize + Math.round(noise(rand) * 600)),
    volume: q.volume + Math.round(Math.abs(noise(rand)) * 14000),
    tickDir: delta > 0 ? 1 : delta < 0 ? -1 : 0,
  };
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const [quotes, setQuotes] = useState<Quote[]>(() => buildQuotes());
  const orders = useMemo<Order[]>(() => buildOrders(1000), []);
  const [positions, setPositions] = useState<Position[]>(() => buildPositions(quotes));
  const [selected, setSelected] = useState<string>('AAPL');
  const [tick, setTick] = useState(0);

  const quoteMap = useMemo(() => new Map(quotes.map((q) => [q.symbol, q])), [quotes]);

  // Per-symbol candle history is expensive; build lazily and cache.
  const candleCache = useRef(new Map<string, Candle[]>());
  const getCandles = useCallback((symbol: string) => {
    const cache = candleCache.current;
    if (!cache.has(symbol)) cache.set(symbol, buildCandles(symbol, baseOf(symbol)));
    return cache.get(symbol)!;
  }, []);

  const [candles, setCandles] = useState<Candle[]>(() => getCandles('AAPL'));
  const [book, setBook] = useState<OrderBook>(() => buildOrderBook('AAPL', baseOf('AAPL')));
  const [prints, setPrints] = useState<Print[]>(() => buildPrints('AAPL', baseOf('AAPL')));

  // Rebuild per-symbol views when the linked selection changes.
  useEffect(() => {
    const q = quotes.find((x) => x.symbol === selected);
    const mid = q?.last ?? baseOf(selected);
    setCandles(getCandles(selected).slice());
    setBook(buildOrderBook(selected, mid));
    setPrints(buildPrints(selected, mid));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // The live feed: tick ~1s. Random subset of the universe moves each beat,
  // and the selected symbol always ticks so its linked panes feel live.
  const printSeq = useRef(100000);
  useEffect(() => {
    const rand = mulberry32(0x1234abcd);
    const id = window.setInterval(() => {
      setQuotes((prev) => {
        const next = prev.slice();
        const movers = 55;
        for (let i = 0; i < movers; i++) {
          const idx = Math.floor(rand() * next.length);
          next[idx] = tickQuote(next[idx], rand);
        }
        const selIdx = next.findIndex((q) => q.symbol === selected);
        if (selIdx >= 0) next[selIdx] = tickQuote(next[selIdx], rand);
        return next;
      });
      setTick((t) => t + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [selected]);

  // When quotes change, refresh positions valuation + the selected symbol's
  // live candle / book / tape so every linked pane stays in sync.
  useEffect(() => {
    setPositions((prev) =>
      prev.map((p) => {
        const q = quoteMap.get(p.symbol);
        if (!q) return p;
        const dir = p.side === 'LONG' ? 1 : -1;
        const unrealized = round2((q.last - p.avgPrice) * p.qty * dir);
        return {
          ...p,
          last: q.last,
          marketValue: round2(q.last * p.qty),
          unrealized,
          unrealizedPct: round2((unrealized / (p.avgPrice * p.qty)) * 100),
          dayPnl: round2(q.change * p.qty * dir),
        };
      }),
    );

    const sel = quoteMap.get(selected);
    if (!sel) return;

    // Note: the candle history is intentionally NOT mutated per tick — doing so
    // would reset the chart's zoom each second. The chart re-binds only when the
    // linked selection changes; the streaming feel is carried by the book/tape/
    // watchlist/ticker. Re-center the book and push a fresh print onto the tape.
    setBook((prev) => {
      const tickSz = Math.max(0.01, round2(sel.last * 0.0005));
      const reseed = mulberry32((printSeq.current += 1));
      let cumB = 0;
      let cumA = 0;
      const bids = prev.bids.map((lvl, i) => {
        const size = Math.max(100, lvl.size + Math.round(noise(reseed) * 500));
        cumB += size;
        return { price: round2(sel.bid - tickSz * i), size, cumulative: cumB, orders: lvl.orders };
      });
      const asks = prev.asks.map((lvl, i) => {
        const size = Math.max(100, lvl.size + Math.round(noise(reseed) * 500));
        cumA += size;
        return { price: round2(sel.ask + tickSz * i), size, cumulative: cumA, orders: lvl.orders };
      });
      return { symbol: selected, bids, asks };
    });

    setPrints((prev) => {
      const reseed = mulberry32((printSeq.current += 7));
      const side: 'BUY' | 'SELL' = sel.tickDir >= 0 ? 'BUY' : 'SELL';
      const newPrint: Print = {
        id: (printSeq.current += 1),
        time: new Date(),
        symbol: selected,
        price: sel.last,
        size: Math.max(100, Math.round(Math.abs(noise(reseed)) * 5000)),
        side,
        cond: side === 'BUY' ? 'A' : 'B',
      };
      return [newPrint, ...prev].slice(0, 80);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const value = useMemo<MarketContextValue>(
    () => ({ quotes, quoteMap, positions, orders, selected, setSelected, candles, book, prints, tick }),
    [quotes, quoteMap, positions, orders, selected, candles, book, prints, tick],
  );

  return <MarketCtx value={value}>{children}</MarketCtx>;
}

export function useMarket(): MarketContextValue {
  const ctx = use(MarketCtx);
  if (!ctx) throw new Error('useMarket must be used within MarketProvider');
  return ctx;
}
