import type {
  CompanyProfile,
  Fundamentals,
  HistoricalDataPoint,
  MarketDataProvider,
  MarketQuote,
  ProviderResult,
} from "../types";

const NOT_CONFIGURED_REASON =
  "Market data provider is not configured. Set MARKET_DATA_PROVIDER and MARKET_DATA_API_KEY in your environment variables to enable live market data.";

/**
 * Null provider — returned when no licensed market data provider is configured.
 * Returns a clear 'not configured' response instead of fake data.
 */
export class NullMarketDataProvider implements MarketDataProvider {
  name = "NullProvider";

  async getQuote(): Promise<ProviderResult<MarketQuote>> {
    return { configured: false, reason: NOT_CONFIGURED_REASON };
  }

  async getCompanyProfile(): Promise<ProviderResult<CompanyProfile>> {
    return { configured: false, reason: NOT_CONFIGURED_REASON };
  }

  async getHistoricalPrices(): Promise<ProviderResult<HistoricalDataPoint[]>> {
    return { configured: false, reason: NOT_CONFIGURED_REASON };
  }

  async getFundamentals(): Promise<ProviderResult<Fundamentals>> {
    return { configured: false, reason: NOT_CONFIGURED_REASON };
  }
}
