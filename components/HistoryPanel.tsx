"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

type HistoryItem = {
  id: string;
  company: string;
  ticker: string | null;
  verdict: "INVEST" | "PASS";
  confidence: number;
  generatedAt: string;
};

export type HistoryReport = {
  id: string;
  generatedAt: string;
  company: string;
  profile: {
    canonicalName: string;
    ticker: string | null;
    website: string | null;
  };
  findings: {
    growthSignals: string[];
    riskSignals: string[];
    competitivePosition: string;
    financialHealth: string;
    keyDevelopments: string[];
    sources: string[];
  };
  verdict: {
    verdict: "INVEST" | "PASS";
    confidence: number;
    reasoning: string[];
    keyRisks: string[];
    keyOpportunities: string[];
  };
  sources: Array<{
    title: string;
    url: string;
    content: string;
  }>;
};

type HistoryPanelProps = {
  refreshKey: number;
  onOpenReport: (report: HistoryReport) => void;
};

export function HistoryPanel({
  refreshKey,
  onOpenReport,
}: HistoryPanelProps) {
  const { user } = useAuth();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [openingId, setOpeningId] = useState("");

  useEffect(() => {
    async function loadHistory() {
      if (!user) {
        setHistory([]);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const token = await user.getIdToken();

        const response = await fetch("/api/history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load history.");
        }

        setHistory(data.history || []);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Could not load history.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadHistory();
  }, [user, refreshKey]);

  async function openReport(reportId: string) {
    if (!user) {
      return;
    }

    setOpeningId(reportId);
    setError("");

    try {
      const token = await user.getIdToken();

      const response = await fetch(
        `/api/history?id=${encodeURIComponent(reportId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not open this report.");
      }

      onOpenReport(data.report);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not open this report.",
      );
    } finally {
      setOpeningId("");
    }
  }

  if (!user) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-6 pb-12">
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Research history
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Your latest fresh research reports.
            </p>
          </div>

          <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
            {history.length} saved
          </span>
        </div>

        {isLoading && (
          <p className="mt-6 text-sm text-slate-400">Loading saved reports...</p>
        )}

        {error && <p className="mt-6 text-sm text-rose-400">{error}</p>}

        {!isLoading && !error && history.length === 0 && (
          <p className="mt-6 text-sm text-slate-400">
            No saved research yet. Run your first company research above.
          </p>
        )}

        {history.length > 0 && (
          <ul className="mt-6 divide-y divide-slate-800">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-white">
                    {item.company}
                    {item.ticker ? ` (${item.ticker})` : ""}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(item.generatedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      item.verdict === "INVEST"
                        ? "bg-emerald-400 text-emerald-950"
                        : "bg-rose-400 text-rose-950"
                    }`}
                  >
                    {item.verdict}
                  </span>

                  <span className="text-sm text-slate-400">
                    {item.confidence}% evidence
                  </span>

                  <button
                    type="button"
                    onClick={() => openReport(item.id)}
                    disabled={openingId === item.id}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {openingId === item.id ? "Opening..." : "Open"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}