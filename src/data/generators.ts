import { intRange, mulberry32, noise, pick, range } from './rng';
import { TRADERS, UNIVERSE, VENUES } from './symbols';
import type {
  Candle,
  Order,
  OrderBook,
  OrderSide,
  OrderStatus,
  OrderType,
  Position,
  Print,
  Quote,
  SymbolMeta,
  TimeInForce,
} from './types';

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Initial quote snapshot for every symbol in the universe. */
export function buildQuotes(): Quote[] {
  const rand = mulberry32(0x5eed01);
  return UNIVERSE.map((m: SymbolMeta) => {
    const prevClose = round2(m.base);
    const drift = noise(rand) * m.base * 0.012;
    const last = round2(Math.max(0.5, prevClose + drift));
    const change = round2(last - prevClose);
    const spread = Math.max(0.01, round2(last * 0.0004 * range(rand, 1, 4)));
    const dayRange = last * range(rand, 0.008, 0.03);
    return {
      symbol: m.symbol,
      name: m.name,
      sector: m.sector,
      last,
      prevClose,
      open: round2(prevClose + noise(rand) * m.base * 0.006),
      high: round2(Math.max(last, prevClose) + dayRange * range(rand, 0.2, 1)),
      low: round2(Math.min(last, prevClose) - dayRange * range(rand, 0.2, 1)),
      bid: round2(last - spread),
      ask: round2(last + spread),
      bidSize: intRange(rand, 1, 40) * 100,
      askSize: intRange(rand, 1, 40) * 100,
      volume: intRange(rand, 80, 9800) * 1000,
      change,
      changePct: round2((change / prevClose) * 100),
      tickDir: 0,
    };
  });
}

const SIDES: OrderSide[] = ['BUY', 'SELL'];
const TYPES: OrderType[] = ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'];
const TIFS: TimeInForce[] = ['DAY', 'GTC', 'IOC', 'FOK'];
// Weighted status distribution — mostly filled/working in a real blotter.
const STATUS_POOL: OrderStatus[] = [
  'FILLED', 'FILLED', 'FILLED', 'FILLED', 'FILLED',
  'WORKING', 'WORKING', 'WORKING',
  'PARTIAL', 'PARTIAL',
  'CANCELLED',
  'REJECTED',
];

/** 1,000 historical/working orders for the blotter, newest first. */
export function buildOrders(count = 1000): Order[] {
  const rand = mulberry32(0xa11ce);
  const orders: Order[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const meta = pick(rand, UNIVERSE);
    const side = pick(rand, SIDES);
    const type = pick(rand, TYPES);
    const status = pick(rand, STATUS_POOL);
    const qty = intRange(rand, 1, 50) * 100;
    const px = round2(meta.base * range(rand, 0.97, 1.03));
    let filled: number;
    switch (status) {
      case 'FILLED': filled = qty; break;
      case 'PARTIAL': filled = intRange(rand, 1, qty / 100 - 1) * 100; break;
      case 'CANCELLED': filled = rand() > 0.5 ? intRange(rand, 0, qty / 100) * 100 : 0; break;
      default: filled = 0; // WORKING / REJECTED
    }
    const limitPrice = type === 'MARKET' ? null : round2(px * (side === 'BUY' ? 0.999 : 1.001));
    const avgFillPrice = filled > 0 ? round2(px * range(rand, 0.999, 1.001)) : 0;
    // Spread orders across the trailing ~6 hours of the session.
    const time = new Date(now - i * intRange(rand, 4000, 26000));
    orders.push({
      id: count - i,
      time,
      symbol: meta.symbol,
      sector: meta.sector,
      side,
      type,
      status,
      tif: pick(rand, TIFS),
      qty,
      filled,
      limitPrice,
      avgFillPrice,
      notional: round2((avgFillPrice || px) * qty),
      trader: pick(rand, TRADERS),
      venue: pick(rand, VENUES),
    });
  }
  return orders;
}

/** A book of open positions (subset of the universe). */
export function buildPositions(quotes: Quote[], count = 28): Position[] {
  const rand = mulberry32(0x90517);
  const chosen = [...quotes].sort(() => rand() - 0.5).slice(0, count);
  return chosen.map((q, i) => {
    const side: 'LONG' | 'SHORT' = rand() > 0.28 ? 'LONG' : 'SHORT';
    const qty = intRange(rand, 1, 60) * 100;
    const avgPrice = round2(q.prevClose * range(rand, 0.88, 1.12));
    const dir = side === 'LONG' ? 1 : -1;
    const marketValue = round2(q.last * qty);
    const unrealized = round2((q.last - avgPrice) * qty * dir);
    const dayPnl = round2(q.change * qty * dir);
    return {
      id: i + 1,
      symbol: q.symbol,
      name: q.name,
      sector: q.sector,
      side,
      qty,
      avgPrice,
      last: q.last,
      marketValue,
      unrealized,
      unrealizedPct: round2((unrealized / (avgPrice * qty)) * 100),
      dayPnl,
    };
  });
}

/** Generate ~`days` of daily OHLC candles ending today for a symbol. */
export function buildCandles(symbol: string, base: number, days = 320): Candle[] {
  // Seed from the symbol so each symbol's history is stable & distinct.
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) seed = (seed * 31 + symbol.charCodeAt(i)) >>> 0;
  const rand = mulberry32(seed || 1);

  const candles: Candle[] = [];
  let price = base * range(rand, 0.6, 0.9); // start lower so we trend up to ~base
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const trend = range(rand, -0.0003, 0.0009);

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    const vol = price * range(rand, 0.008, 0.028);
    const open = round2(price);
    const drift = trend * price + noise(rand) * vol;
    const close = round2(Math.max(0.5, open + drift));
    const high = round2(Math.max(open, close) + Math.abs(noise(rand)) * vol);
    const low = round2(Math.min(open, close) - Math.abs(noise(rand)) * vol);
    candles.push({
      date,
      open,
      high,
      low,
      close,
      volume: intRange(rand, 800, 64000) * 1000,
    });
    price = close;
  }
  return candles;
}

/** Build a Level II depth book around a mid price. */
export function buildOrderBook(symbol: string, mid: number, levels = 14): OrderBook {
  let seed = 7;
  for (let i = 0; i < symbol.length; i++) seed = (seed * 17 + symbol.charCodeAt(i)) >>> 0;
  const rand = mulberry32(seed || 3);
  const tick = Math.max(0.01, round2(mid * 0.0005));
  const bids = [];
  const asks = [];
  let cumB = 0;
  let cumA = 0;
  for (let i = 0; i < levels; i++) {
    const bSize = intRange(rand, 1, 28) * 100;
    const aSize = intRange(rand, 1, 28) * 100;
    cumB += bSize;
    cumA += aSize;
    bids.push({ price: round2(mid - tick * (i + 1)), size: bSize, cumulative: cumB, orders: intRange(rand, 1, 12) });
    asks.push({ price: round2(mid + tick * (i + 1)), size: aSize, cumulative: cumA, orders: intRange(rand, 1, 12) });
  }
  return { symbol, bids, asks };
}

/** Build a tape of recent prints for a symbol. */
export function buildPrints(symbol: string, mid: number, count = 60): Print[] {
  let seed = 11;
  for (let i = 0; i < symbol.length; i++) seed = (seed * 13 + symbol.charCodeAt(i)) >>> 0;
  const rand = mulberry32(seed || 5);
  const prints: Print[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const side: 'BUY' | 'SELL' = rand() > 0.5 ? 'BUY' : 'SELL';
    const cond = side === 'BUY' ? 'A' : 'B';
    prints.push({
      id: count - i,
      time: new Date(now - i * intRange(rand, 200, 2400)),
      symbol,
      price: round2(mid + noise(rand) * mid * 0.0009),
      size: intRange(rand, 1, 50) * 100,
      side,
      cond: rand() > 0.9 ? 'M' : cond,
    });
  }
  return prints;
}
