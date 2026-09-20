import type { MarketDataProvider } from "./types";
import { NullMarketDataProvider } from "./providers/nullProvider";

let _provider: MarketDataProvider | null = null;

/**
 * Returns the configured market data provider.
 *
 * To add a real provider:
 *   1. Set MARKET_DATA_PROVIDER=<provider-name> in .env.local
 *   2. Set MARKET_DATA_API_KEY=<your-api-key> in .env.local
 *   3. Implement MarketDataProvider in library/market/providers/<name>.ts
 *   4. Import and instantiate it in the switch below
 *
 * Supported providers: (add yours here)
 *   - "null" (default — not configured)
 */
export function getMarketDataProvider(): MarketDataProvider {
  if (_provider) return _provider;

  const providerName = process.env.MARKET_DATA_PROVIDER ?? "null";

  switch (providerName.toLowerCase()) {
    // Add real provider cases here:
    // case "alphavantage":
    //   _provider = new AlphaVantageProvider(process.env.MARKET_DATA_API_KEY!);
    //   break;
    // case "polygon":
    //   _provider = new PolygonProvider(process.env.MARKET_DATA_API_KEY!);
    //   break;

    default:
      _provider = new NullMarketDataProvider();
      break;
  }

  return _provider;
}
