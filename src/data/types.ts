// Domain model for the trading workstation. Mock data only.

export interface SymbolMeta {
  symbol: string;
  name: string;
  sector: string;
  /** Reference / opening price used to seed the live feed. */
  base: number;
}

/** A live quote — mutated in place by the feed engine each tick. */
export interface Quote {
  symbol: string;
  name: string;
  sector: string;
  last: number;
  prevClose: number;
  open: number;
  high: number;
  low: number;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  volume: number;
  change: number; // last - prevClose
  changePct: number; // change / prevClose * 100
  /** Direction of the most recent tick: 1 up, -1 down, 0 unchanged. */
  tickDir: -1 | 0 | 1;
}

export interface Position {
  id: number;
  symbol: string;
  name: string;
  sector: string;
  side: 'LONG' | 'SHORT';
  qty: number;
  avgPrice: number;
  last: number;
  marketValue: number;
  unrealized: number;
  unrealizedPct: number;
  dayPnl: number;
}

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
export type OrderStatus = 'FILLED' | 'PARTIAL' | 'WORKING' | 'CANCELLED' | 'REJECTED';
export type TimeInForce = 'DAY' | 'GTC' | 'IOC' | 'FOK';

export interface Order {
  id: number;
  time: Date;
  symbol: string;
  sector: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  tif: TimeInForce;
  qty: number;
  filled: number;
  limitPrice: number | null;
  avgFillPrice: number;
  notional: number;
  trader: string;
  venue: string;
}

export interface DepthLevel {
  price: number;
  size: number;
  /** cumulative size from top of book */
  cumulative: number;
  orders: number;
}

export interface OrderBook {
  symbol: string;
  bids: DepthLevel[];
  asks: DepthLevel[];
}

export interface Print {
  id: number;
  time: Date;
  symbol: string;
  price: number;
  size: number;
  side: 'BUY' | 'SELL';
  /** 'A' at ask, 'B' at bid, 'M' midpoint */
  cond: 'A' | 'B' | 'M';
}

export interface Candle {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
