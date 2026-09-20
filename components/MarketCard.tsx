"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

type QuoteData = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  timestamp: string;
  isStale: boolean;
  dataNote: string | null;
};

type MarketCardProps = {
  ticker: string;
};

export function MarketCard({ ticker }: MarketCardProps) {
  const { user } = useAuth();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadQuote() {
      if (!user || !ticker) return;
      setIsLoading(true);
      setError("");
      try {
        const token = await user.getIdToken();
        const res = await fetch(
          `/api/market/quote?symbol=${encodeURIComponent(ticker)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();

        if (data.configured === false) {
          setConfigured(false);
          return;
        }

        if (!res.ok) {
          throw new Error(data.error?.message ?? "Could not load market data.");
        }

        setConfigured(true);
        setQuote(data.quote);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Market data unavailable.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadQuote();
  }, [user, ticker]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border-main bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-4 w-16 animate-pulse rounded bg-surface-muted" />
          <div className="h-6 w-24 animate-pulse rounded bg-surface-muted" />
        </div>
        <div className="mt-3 h-3 w-32 animate-pulse rounded bg-surface-muted" />
      </div>
    );
  }

  if (configured === false) {
    return (
      <div className="rounded-2xl border border-border-main bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-text-muted">{ticker}</span>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text-muted">
            Market data not configured
          </span>
        </div>
        <p className="mt-2 text-xs text-text-muted/70">
          Set MARKET_DATA_PROVIDER and MARKET_DATA_API_KEY to enable live prices.
        </p>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="rounded-2xl border border-border-main bg-surface p-5 shadow-sm">
        <span className="font-mono text-sm font-bold text-text-muted">{ticker}</span>
        <p className="mt-2 text-xs text-red-600">{error || "Data unavailable."}</p>
      </div>
    );
  }

  const isPositive = quote.change >= 0;

  return (
    <div className="rounded-2xl border border-border-main bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-sm font-bold text-text-muted">{quote.symbol}</span>
          <p className="mt-1 text-2xl font-bold text-text-main">
            {quote.currency} {quote.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className={`mt-1 text-sm font-semibold ${isPositive ? "text-[#137333]" : "text-[#C5221F]"}`}>
            {isPositive ? "+" : ""}{quote.change.toFixed(2)} ({isPositive ? "+" : ""}{quote.changePercent.toFixed(2)}%)
          </p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isPositive ? "bg-[#E6F4EA] text-[#137333]" : "bg-[#FCE8E6] text-[#C5221F]"}`}>
          <span className="text-lg">{isPositive ? "↑" : "↓"}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {quote.isStale && (
          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 border border-yellow-200">
            Cached data
          </span>
        )}
        {quote.dataNote && (
          <span className="text-xs text-text-muted">{quote.dataNote}</span>
        )}
        <span className="text-xs text-text-muted">
          Updated {new Date(quote.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
