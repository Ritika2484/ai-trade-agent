"use client";

import { useAuth } from "../../components/AuthContext";
import { WatchlistPanel } from "../../components/WatchlistPanel";

export default function WatchlistPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-5xl">📋</p>
        <h1 className="mt-6 text-3xl font-bold text-text-main">Sign in to view your watchlist</h1>
        <p className="mt-3 text-lg text-text-muted">
          Track companies you&apos;re monitoring with notes and target prices.
        </p>
      </div>
    );
  }

  return (
    <div className="py-12 bg-background min-h-screen">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-main">Watchlist</h1>
          <p className="mt-2 text-base text-text-muted">
            Companies you&apos;re tracking. Add notes and target prices for future reference.
          </p>
        </div>
      </div>
      <WatchlistPanel />
    </div>
  );
}
