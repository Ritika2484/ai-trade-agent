"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

type WatchlistItem = {
  id: string;
  displayName: string;
  ticker: string | null;
  notes: string;
  targetPrice: number | null;
  currency: string;
  alertEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

type AddToWatchlistPayload = {
  displayName: string;
  ticker?: string | null;
  notes?: string;
  targetPrice?: number | null;
  currency?: string;
};

type WatchlistPanelProps = {
  /** Optional pre-fill from a research result */
  prefill?: { displayName: string; ticker?: string | null };
};

export function WatchlistPanel({ prefill }: WatchlistPanelProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add form state
  const [adding, setAdding] = useState(false);
  const [addName, setAddName] = useState(prefill?.displayName ?? "");
  const [addTicker, setAddTicker] = useState(prefill?.ticker ?? "");
  const [addNotes, setAddNotes] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addCurrency, setAddCurrency] = useState("USD");
  const [isSaving, setIsSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadWatchlist = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/watchlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Could not load watchlist.");
      setItems(data.watchlist ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load watchlist.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    async function run() {
      await loadWatchlist();
    }
    run().catch(console.error);
  }, [loadWatchlist]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !addName.trim()) return;
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const token = await user.getIdToken();
      const payload: AddToWatchlistPayload = {
        displayName: addName.trim(),
        ticker: addTicker.trim() || null,
        notes: addNotes.trim(),
        targetPrice: addPrice ? parseFloat(addPrice) : null,
        currency: addCurrency || "USD",
      };
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Could not add to watchlist.");
      setItems((prev) => [data.item, ...prev]);
      setSuccess(`${data.item.displayName} added to your watchlist.`);
      setAdding(false);
      setAddName(""); setAddTicker(""); setAddNotes(""); setAddPrice(""); setAddCurrency("USD");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add to watchlist.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!user) return;
    setIsUpdating(true);
    setError("");
    setSuccess("");
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/watchlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          notes: editNotes.trim(),
          targetPrice: editPrice ? parseFloat(editPrice) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Could not update.");
      setItems((prev) => prev.map((item) => item.id === id ? data.item : item));
      setSuccess("Watchlist entry updated.");
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!user) return;
    setDeletingId(id);
    setError("");
    setSuccess("");
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/watchlist/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Could not remove.");
      setItems((prev) => prev.filter((item) => item.id !== id));
      setSuccess("Company removed from watchlist.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!user) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 pb-12">
      <div className="rounded-2xl border border-border-main bg-surface p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-main">
              Watchlist
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Track companies you want to monitor.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-surface-muted px-3 py-1 text-sm text-text-muted border border-border-main">
              {items.length} saved
            </span>
            <button
              id="watchlist-add-btn"
              onClick={() => { setAdding(!adding); setAddName(prefill?.displayName ?? ""); setAddTicker(prefill?.ticker ?? ""); }}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-surface hover:bg-primary-dark transition-colors"
            >
              {adding ? "Cancel" : "+ Add company"}
            </button>
          </div>
        </div>

        {/* Success/Error feedback */}
        {success && (
          <p className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-200">
            {success}
          </p>
        )}
        {error && (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
            {error}
          </p>
        )}

        {/* Add form */}
        {adding && (
          <form
            onSubmit={(e) => void handleAdd(e)}
            className="mt-6 rounded-xl border border-border-main bg-surface-muted/30 p-5 shadow-inner"
          >
            <p className="mb-4 text-sm font-semibold text-text-main">Add a company</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Company name *</label>
                <input
                  id="watchlist-name-input"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  required
                  maxLength={200}
                  placeholder="e.g. Apple Inc."
                  className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-main placeholder:text-text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Ticker (optional)</label>
                <input
                  id="watchlist-ticker-input"
                  value={addTicker}
                  onChange={(e) => setAddTicker(e.target.value.toUpperCase())}
                  maxLength={10}
                  placeholder="e.g. AAPL"
                  className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-main placeholder:text-text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Target price (optional)</label>
                <div className="flex gap-2">
                  <input
                    id="watchlist-price-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={addPrice}
                    onChange={(e) => setAddPrice(e.target.value)}
                    placeholder="e.g. 150.00"
                    className="flex-1 rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-main placeholder:text-text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                  <select
                    value={addCurrency}
                    onChange={(e) => setAddCurrency(e.target.value)}
                    className="rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                  >
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                    <option>INR</option>
                    <option>JPY</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Notes (optional)</label>
                <input
                  id="watchlist-notes-input"
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  maxLength={1000}
                  placeholder="Why you're watching this company..."
                  className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-main placeholder:text-text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="submit"
                disabled={isSaving || !addName.trim()}
                id="watchlist-save-btn"
                className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-surface hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
              >
                {isSaving ? "Saving..." : "Save to watchlist"}
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded-full border border-border-main bg-surface px-5 py-2 text-sm text-text-muted hover:bg-surface-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-muted" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && items.length === 0 && (
          <div className="mt-10 py-12 text-center rounded-xl border border-dashed border-border-main bg-surface-muted/30">
            <p className="text-4xl">📋</p>
            <p className="mt-4 text-base font-semibold text-text-main">Your watchlist is empty</p>
            <p className="mt-1 text-sm text-text-muted">
              Add companies you want to track for future research.
            </p>
          </div>
        )}

        {/* Watchlist items */}
        {!isLoading && items.length > 0 && (
          <ul className="mt-8 divide-y divide-border-main border-t border-border-main">
            {items.map((item) => (
              <li key={item.id} className="py-5">
                {editingId === item.id ? (
                  <div className="rounded-xl border border-border-main bg-surface-muted/30 p-5 shadow-inner">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-text-muted">Notes</label>
                        <input
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          maxLength={1000}
                          className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-text-muted">Target price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => void handleUpdate(item.id)}
                        disabled={isUpdating}
                        className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-surface hover:bg-primary-dark disabled:opacity-60 transition-colors"
                      >
                        {isUpdating ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-full border border-border-main px-4 py-2 text-sm text-text-muted hover:bg-surface-muted transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between group">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <p className="font-semibold text-text-main text-lg">{item.displayName}</p>
                        {item.ticker && (
                          <span className="rounded bg-surface-muted px-2 py-0.5 text-xs font-mono font-medium text-text-muted border border-border-main">
                            {item.ticker}
                          </span>
                        )}
                        {item.targetPrice && (
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary-dark">
                            Target: {item.currency} {item.targetPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <p className="mt-2 text-sm text-text-muted leading-relaxed line-clamp-2">{item.notes}</p>
                      )}
                      <p className="mt-2 text-xs text-text-muted/60">
                        Added {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setEditNotes(item.notes ?? "");
                          setEditPrice(item.targetPrice?.toString() ?? "");
                        }}
                        className="rounded-lg border border-border-main px-3 py-1.5 text-sm text-text-muted hover:bg-surface-muted transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => void handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
                      >
                        {deletingId === item.id ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
