import { mulberry32, range } from './rng';
import type { SymbolMeta } from './types';

// A curated set of real, recognizable tickers across sectors, then padded with
// synthetic-but-plausible names so the watchlist comfortably exceeds 200 rows.

const SECTORS = [
  'Technology',
  'Financials',
  'Healthcare',
  'Energy',
  'Consumer',
  'Industrials',
  'Communication',
  'Materials',
  'Utilities',
  'Real Estate',
] as const;

interface Seed {
  symbol: string;
  name: string;
  sector: (typeof SECTORS)[number];
  base: number;
}

const CURATED: Seed[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', base: 229.8 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', base: 421.5 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', base: 138.2 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer', base: 201.4 },
  { symbol: 'GOOGL', name: 'Alphabet Inc. A', sector: 'Communication', base: 179.6 },
  { symbol: 'META', name: 'Meta Platforms', sector: 'Communication', base: 585.3 },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer', base: 248.9 },
  { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology', base: 172.1 },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway', sector: 'Financials', base: 462.0 },
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', base: 243.7 },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financials', base: 312.5 },
  { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financials', base: 521.8 },
  { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', base: 588.2 },
  { symbol: 'LLY', name: 'Eli Lilly & Co.', sector: 'Healthcare', base: 782.4 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', base: 152.9 },
  { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy', base: 118.6 },
  { symbol: 'CVX', name: 'Chevron Corp.', sector: 'Energy', base: 161.3 },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer', base: 92.7 },
  { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer', base: 168.5 },
  { symbol: 'HD', name: 'Home Depot', sector: 'Consumer', base: 408.1 },
  { symbol: 'KO', name: 'Coca-Cola Co.', sector: 'Consumer', base: 62.4 },
  { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer', base: 152.8 },
  { symbol: 'COST', name: 'Costco Wholesale', sector: 'Consumer', base: 912.6 },
  { symbol: 'BAC', name: 'Bank of America', sector: 'Financials', base: 46.2 },
  { symbol: 'WFC', name: 'Wells Fargo', sector: 'Financials', base: 73.9 },
  { symbol: 'GS', name: 'Goldman Sachs', sector: 'Financials', base: 582.4 },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'Financials', base: 128.7 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', base: 121.5 },
  { symbol: 'INTC', name: 'Intel Corp.', sector: 'Technology', base: 24.3 },
  { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology', base: 348.9 },
  { symbol: 'ORCL', name: 'Oracle Corp.', sector: 'Technology', base: 187.2 },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology', base: 512.6 },
  { symbol: 'CSCO', name: 'Cisco Systems', sector: 'Technology', base: 58.4 },
  { symbol: 'QCOM', name: 'Qualcomm Inc.', sector: 'Technology', base: 168.3 },
  { symbol: 'TXN', name: 'Texas Instruments', sector: 'Technology', base: 196.1 },
  { symbol: 'IBM', name: 'IBM Corp.', sector: 'Technology', base: 233.4 },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication', base: 842.1 },
  { symbol: 'DIS', name: 'Walt Disney Co.', sector: 'Communication', base: 113.8 },
  { symbol: 'CMCSA', name: 'Comcast Corp.', sector: 'Communication', base: 42.6 },
  { symbol: 'T', name: 'AT&T Inc.', sector: 'Communication', base: 22.9 },
  { symbol: 'VZ', name: 'Verizon Comm.', sector: 'Communication', base: 43.1 },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare', base: 26.7 },
  { symbol: 'MRK', name: 'Merck & Co.', sector: 'Healthcare', base: 99.4 },
  { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare', base: 178.2 },
  { symbol: 'TMO', name: 'Thermo Fisher', sector: 'Healthcare', base: 528.9 },
  { symbol: 'ABT', name: 'Abbott Labs', sector: 'Healthcare', base: 114.3 },
  { symbol: 'DHR', name: 'Danaher Corp.', sector: 'Healthcare', base: 232.5 },
  { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials', base: 388.7 },
  { symbol: 'BA', name: 'Boeing Co.', sector: 'Industrials', base: 154.2 },
  { symbol: 'HON', name: 'Honeywell Intl.', sector: 'Industrials', base: 218.6 },
  { symbol: 'GE', name: 'GE Aerospace', sector: 'Industrials', base: 181.9 },
  { symbol: 'UPS', name: 'United Parcel', sector: 'Industrials', base: 131.5 },
  { symbol: 'RTX', name: 'RTX Corp.', sector: 'Industrials', base: 118.7 },
  { symbol: 'DE', name: 'Deere & Co.', sector: 'Industrials', base: 412.3 },
  { symbol: 'LMT', name: 'Lockheed Martin', sector: 'Industrials', base: 548.2 },
  { symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy', base: 104.8 },
  { symbol: 'SLB', name: 'Schlumberger', sector: 'Energy', base: 42.1 },
  { symbol: 'EOG', name: 'EOG Resources', sector: 'Energy', base: 128.4 },
  { symbol: 'MPC', name: 'Marathon Petroleum', sector: 'Energy', base: 152.7 },
  { symbol: 'PSX', name: 'Phillips 66', sector: 'Energy', base: 131.2 },
  { symbol: 'NEE', name: 'NextEra Energy', sector: 'Utilities', base: 78.3 },
  { symbol: 'DUK', name: 'Duke Energy', sector: 'Utilities', base: 116.9 },
  { symbol: 'SO', name: 'Southern Co.', sector: 'Utilities', base: 88.4 },
  { symbol: 'D', name: 'Dominion Energy', sector: 'Utilities', base: 56.2 },
  { symbol: 'LIN', name: 'Linde plc', sector: 'Materials', base: 458.1 },
  { symbol: 'SHW', name: 'Sherwin-Williams', sector: 'Materials', base: 372.6 },
  { symbol: 'APD', name: 'Air Products', sector: 'Materials', base: 312.8 },
  { symbol: 'FCX', name: 'Freeport-McMoRan', sector: 'Materials', base: 42.9 },
  { symbol: 'NEM', name: 'Newmont Corp.', sector: 'Materials', base: 44.7 },
  { symbol: 'PLD', name: 'Prologis Inc.', sector: 'Real Estate', base: 118.5 },
  { symbol: 'AMT', name: 'American Tower', sector: 'Real Estate', base: 198.3 },
  { symbol: 'EQIX', name: 'Equinix Inc.', sector: 'Real Estate', base: 912.4 },
  { symbol: 'SPG', name: 'Simon Property', sector: 'Real Estate', base: 172.6 },
  { symbol: 'O', name: 'Realty Income', sector: 'Real Estate', base: 58.9 },
  { symbol: 'PANW', name: 'Palo Alto Networks', sector: 'Technology', base: 388.2 },
  { symbol: 'NOW', name: 'ServiceNow Inc.', sector: 'Technology', base: 1042.7 },
  { symbol: 'SNOW', name: 'Snowflake Inc.', sector: 'Technology', base: 162.4 },
  { symbol: 'UBER', name: 'Uber Technologies', sector: 'Technology', base: 72.8 },
  { symbol: 'SHOP', name: 'Shopify Inc.', sector: 'Technology', base: 108.3 },
  { symbol: 'PYPL', name: 'PayPal Holdings', sector: 'Financials', base: 86.5 },
  { symbol: 'SQ', name: 'Block Inc.', sector: 'Financials', base: 88.7 },
  { symbol: 'COIN', name: 'Coinbase Global', sector: 'Financials', base: 312.9 },
  { symbol: 'PLTR', name: 'Palantir Tech.', sector: 'Technology', base: 64.2 },
  { symbol: 'MU', name: 'Micron Technology', sector: 'Technology', base: 102.6 },
  { symbol: 'AMAT', name: 'Applied Materials', sector: 'Technology', base: 178.4 },
  { symbol: 'LRCX', name: 'Lam Research', sector: 'Technology', base: 78.9 },
  { symbol: 'KLAC', name: 'KLA Corp.', sector: 'Technology', base: 628.1 },
  { symbol: 'MRVL', name: 'Marvell Technology', sector: 'Technology', base: 88.3 },
  { symbol: 'SMCI', name: 'Super Micro Computer', sector: 'Technology', base: 42.7 },
  { symbol: 'ASML', name: 'ASML Holding', sector: 'Technology', base: 712.5 },
  { symbol: 'ARM', name: 'Arm Holdings', sector: 'Technology', base: 138.6 },
  { symbol: 'DELL', name: 'Dell Technologies', sector: 'Technology', base: 122.4 },
  { symbol: 'WDAY', name: 'Workday Inc.', sector: 'Technology', base: 258.7 },
  { symbol: 'TEAM', name: 'Atlassian Corp.', sector: 'Technology', base: 232.1 },
  { symbol: 'DDOG', name: 'Datadog Inc.', sector: 'Technology', base: 132.8 },
  { symbol: 'NET', name: 'Cloudflare Inc.', sector: 'Technology', base: 98.4 },
  { symbol: 'CRWD', name: 'CrowdStrike', sector: 'Technology', base: 348.2 },
  { symbol: 'ZS', name: 'Zscaler Inc.', sector: 'Technology', base: 198.6 },
  { symbol: 'MDB', name: 'MongoDB Inc.', sector: 'Technology', base: 282.4 },
  { symbol: 'F', name: 'Ford Motor Co.', sector: 'Consumer', base: 11.2 },
  { symbol: 'GM', name: 'General Motors', sector: 'Consumer', base: 52.8 },
  { symbol: 'NKE', name: 'Nike Inc.', sector: 'Consumer', base: 78.3 },
  { symbol: 'SBUX', name: 'Starbucks Corp.', sector: 'Consumer', base: 98.6 },
  { symbol: 'MCD', name: "McDonald's Corp.", sector: 'Consumer', base: 292.4 },
  { symbol: 'LOW', name: "Lowe's Cos.", sector: 'Consumer', base: 262.8 },
  { symbol: 'TGT', name: 'Target Corp.', sector: 'Consumer', base: 142.6 },
  { symbol: 'CL', name: 'Colgate-Palmolive', sector: 'Consumer', base: 94.2 },
  { symbol: 'MDLZ', name: 'Mondelez Intl.', sector: 'Consumer', base: 68.4 },
  { symbol: 'C', name: 'Citigroup Inc.', sector: 'Financials', base: 68.9 },
  { symbol: 'SCHW', name: 'Charles Schwab', sector: 'Financials', base: 72.4 },
  { symbol: 'BLK', name: 'BlackRock Inc.', sector: 'Financials', base: 982.1 },
  { symbol: 'AXP', name: 'American Express', sector: 'Financials', base: 288.6 },
  { symbol: 'SPGI', name: 'S&P Global', sector: 'Financials', base: 512.3 },
  { symbol: 'CB', name: 'Chubb Ltd.', sector: 'Financials', base: 282.7 },
  { symbol: 'PGR', name: 'Progressive Corp.', sector: 'Financials', base: 242.8 },
  { symbol: 'BMY', name: 'Bristol-Myers', sector: 'Healthcare', base: 54.2 },
  { symbol: 'AMGN', name: 'Amgen Inc.', sector: 'Healthcare', base: 312.6 },
  { symbol: 'GILD', name: 'Gilead Sciences', sector: 'Healthcare', base: 88.9 },
  { symbol: 'CVS', name: 'CVS Health', sector: 'Healthcare', base: 56.4 },
  { symbol: 'ISRG', name: 'Intuitive Surgical', sector: 'Healthcare', base: 512.8 },
  { symbol: 'VRTX', name: 'Vertex Pharma', sector: 'Healthcare', base: 458.2 },
  { symbol: 'REGN', name: 'Regeneron Pharma', sector: 'Healthcare', base: 742.6 },
  { symbol: 'MRNA', name: 'Moderna Inc.', sector: 'Healthcare', base: 42.3 },
  { symbol: 'MMM', name: '3M Co.', sector: 'Industrials', base: 132.7 },
  { symbol: 'EMR', name: 'Emerson Electric', sector: 'Industrials', base: 118.4 },
  { symbol: 'ETN', name: 'Eaton Corp.', sector: 'Industrials', base: 332.8 },
  { symbol: 'ITW', name: 'Illinois Tool Works', sector: 'Industrials', base: 258.6 },
  { symbol: 'CSX', name: 'CSX Corp.', sector: 'Industrials', base: 34.2 },
  { symbol: 'UNP', name: 'Union Pacific', sector: 'Industrials', base: 242.7 },
  { symbol: 'WM', name: 'Waste Management', sector: 'Industrials', base: 212.4 },
];

const PREFIXES = ['Quant', 'Apex', 'Nova', 'Helio', 'Vertex', 'Strato', 'Orbit', 'Pulse', 'Vector', 'Lumen', 'Cobalt', 'Titan', 'Onyx', 'Zenith', 'Atlas', 'Sigma', 'Delta', 'Crest', 'Forge', 'Pinnacle'];
const SUFFIXES = ['Dynamics', 'Holdings', 'Labs', 'Systems', 'Capital', 'Networks', 'Industries', 'Bio', 'Energy', 'Robotics', 'Materials', 'Group', 'Logistics', 'Partners', 'Therapeutics'];

function buildUniverse(): SymbolMeta[] {
  const out: SymbolMeta[] = CURATED.map((s) => ({ ...s }));
  const used = new Set(out.map((s) => s.symbol));
  const rand = mulberry32(0xc0ffee);

  let pi = 0;
  let si = 0;
  while (out.length < 232) {
    const prefix = PREFIXES[pi % PREFIXES.length];
    const suffix = SUFFIXES[si % SUFFIXES.length];
    // ticker from prefix letters + a rotating digit-ish suffix
    let sym = (prefix.slice(0, 3) + suffix.slice(0, 1)).toUpperCase();
    let bump = 0;
    while (used.has(sym)) {
      bump++;
      sym = (prefix.slice(0, 2) + suffix.slice(0, 1) + bump).toUpperCase();
    }
    used.add(sym);
    out.push({
      symbol: sym,
      name: `${prefix} ${suffix}`,
      sector: SECTORS[(pi + si) % SECTORS.length],
      base: +range(rand, 12, 480).toFixed(2),
    });
    si++;
    if (si % SUFFIXES.length === 0) pi++;
  }
  return out;
}

export const UNIVERSE: SymbolMeta[] = buildUniverse();
export const ALL_SECTORS = SECTORS;
export const TRADERS = ['J. Reyes', 'M. Cohen', 'A. Okafor', 'L. Tanaka', 'S. Patel', 'K. Müller', 'D. Rossi', 'N. Haddad'];
export const VENUES = ['NYSE', 'NASDAQ', 'ARCA', 'BATS', 'IEX', 'EDGX'];
