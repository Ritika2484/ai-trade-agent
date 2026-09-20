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
      <div className="rounded-2xl border border-border-main bg-surface p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-text-main">
              Research history
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Your latest fresh research reports.
            </p>
          </div>

          <span className="rounded-full bg-surface-muted border border-border-main px-3 py-1 text-sm text-text-muted">
            {history.length} saved
          </span>
        </div>

        {isLoading && (
          <p className="mt-8 text-sm text-text-muted">Loading saved reports...</p>
        )}

        {error && <p className="mt-8 text-sm text-red-600">{error}</p>}

        {!isLoading && !error && history.length === 0 && (
          <div className="mt-10 py-12 text-center rounded-xl border border-dashed border-border-main bg-surface-muted/30">
            <p className="text-4xl">📄</p>
            <p className="mt-4 text-base font-semibold text-text-main">No research reports yet.</p>
            <p className="mt-1 text-sm text-text-muted">
              Research a company and your reports will appear here.
            </p>
          </div>
        )}

        {history.length > 0 && (
          <ul className="mt-8 divide-y divide-border-main border-t border-border-main">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between group"
              >
                <div>
                  <p className="font-semibold text-text-main text-lg">
                    {item.company}
                    {item.ticker ? <span className="ml-2 font-mono text-sm text-text-muted font-normal">({item.ticker})</span> : ""}
                  </p>

                  <p className="mt-1.5 text-sm text-text-muted/60">
                    {new Date(item.generatedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`rounded-full px-3.5 py-1 text-xs font-bold ${
                      item.verdict === "INVEST"
                        ? "bg-[#E6F4EA] text-[#137333]"
                        : "bg-[#FCE8E6] text-[#C5221F]"
                    }`}
                  >
                    {item.verdict}
                  </span>

                  <span className="text-sm font-medium text-text-muted hidden sm:inline-block">
                    {item.confidence}% evidence
                  </span>

                  <button
                    type="button"
                    onClick={() => openReport(item.id)}
                    disabled={openingId === item.id}
                    className="rounded-full border border-border-main px-4 py-2 text-sm font-medium text-text-main hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                  >
                    {openingId === item.id ? "Opening..." : "Open Report"}
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