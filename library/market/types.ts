export type MarketQuote = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  timestamp: string;
  /** true if data is from cache, not real-time */
  isStale: boolean;
  /** e.g. "15-min delay" */
  dataNote: string | null;
};

export type CompanyProfile = {
  name: string;
  symbol: string;
  exchange: string | null;
  industry: string | null;
  sector: string | null;
  description: string | null;
  website: string | null;
  marketCap: number | null;
  currency: string;
};

export type HistoricalDataPoint = {
  date: string; // "YYYY-MM-DD"
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Fundamentals = {
  peRatio: number | null;
  eps: number | null;
  dividendYield: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  averageVolume: number | null;
  marketCap: number | null;
  currency: string;
};

export type ProviderResult<T> =
  | { configured: true; data: T }
  | { configured: false; reason: string };

/**
 * Interface for market data providers.
 * Implement this to add a new provider (e.g., Alpha Vantage, Polygon, Finnhub).
 */
export interface MarketDataProvider {
  name: string;
  getQuote(symbol: string): Promise<ProviderResult<MarketQuote>>;
  getCompanyProfile(symbol: string): Promise<ProviderResult<CompanyProfile>>;
  getHistoricalPrices(
    symbol: string,
    days?: number,
  ): Promise<ProviderResult<HistoricalDataPoint[]>>;
  getFundamentals(symbol: string): Promise<ProviderResult<Fundamentals>>;
}
