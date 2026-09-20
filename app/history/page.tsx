"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "../../components/AuthContext";
import type { HistoryReport } from "../../components/HistoryPanel";

type HistoryItem = {
  id: string;
  company: string;
  ticker: string | null;
  companyQuery: string;
  verdict: "INVEST" | "PASS";
  confidence: number;
  generatedAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [openedReport, setOpenedReport] = useState<HistoryReport | null>(null);
  const [openingId, setOpeningId] = useState("");

  const loadHistory = useCallback(async (pageNum: number) => {
    if (!user) return;
    setIsLoading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/history?page=${pageNum}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Could not load history.");
      setHistory(data.history ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load history.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      async function run() {
        await loadHistory(page);
      }
      run().catch(console.error);
    }
  }, [user, authLoading, page, loadHistory]);

  async function openReport(reportId: string) {
    if (!user) return;
    setOpeningId(reportId);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/history?id=${encodeURIComponent(reportId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Could not open report.");
      setOpenedReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open report.");
    } finally {
      setOpeningId("");
    }
  }

  // Client-side search filter
  const filtered = history.filter((item) =>
    !search.trim() ||
    item.company.toLowerCase().includes(search.toLowerCase()) ||
    (item.ticker ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  if (authLoading) {
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
        <p className="text-5xl">🔒</p>
        <h1 className="mt-6 text-3xl font-bold text-text-main">Sign in to view history</h1>
        <p className="mt-3 text-lg text-text-muted">
          Your research history is private and requires sign-in to access.
        </p>
      </div>
    );
  }

  if (openedReport) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 bg-background min-h-screen">
        <button
          onClick={() => setOpenedReport(null)}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors"
        >
          ← Back to history
        </button>
        <ReportView report={openedReport} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 bg-background min-h-screen">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-main">Research History</h1>
          <p className="mt-2 text-base text-text-muted">
            Your saved research reports — click to re-open.
          </p>
        </div>
        {pagination && (
          <span className="rounded-full bg-surface-muted border border-border-main px-3 py-1 text-sm text-text-muted">
            {pagination.total} total reports
          </span>
        )}
      </div>

      {/* Search */}
      <div className="mb-8">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company or ticker..."
          className="w-full rounded-2xl border border-border-main bg-surface px-4 py-3.5 text-text-main placeholder:text-text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
        />
      </div>

      {error && (
        <p className="mb-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">{error}</p>
      )}

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-border-main bg-surface-muted/30 py-20 text-center">
          <p className="text-5xl">📊</p>
          <p className="mt-6 text-xl font-semibold text-text-main">
            {search ? "No matching reports" : "No research reports yet"}
          </p>
          <p className="mt-2 text-base text-text-muted">
            {search
              ? `No reports found for "${search}".`
              : "Run your first research from the home page."}
          </p>
            <Link
            href="/"
            className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-surface hover:bg-primary-dark transition-colors"
          >
            Research a company
          </Link>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="rounded-2xl border border-border-main bg-surface divide-y divide-border-main shadow-sm">
          {filtered.map((item) => (
            <article key={item.id} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between group">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-text-main text-lg">{item.company}</p>
                  {item.ticker && (
                    <span className="rounded bg-surface-muted px-2 py-0.5 text-xs font-mono font-medium text-text-muted border border-border-main">
                      {item.ticker}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-text-muted/70">
                  {new Date(item.generatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span
                  className={`rounded-full px-3.5 py-1 text-xs font-bold ${
                    item.verdict === "INVEST"
                      ? "bg-[#E6F4EA] text-[#137333]"
                      : "bg-[#FCE8E6] text-[#C5221F]"
                  }`}
                >
                  {item.verdict}
                </span>
                <span className="text-sm font-medium text-text-muted hidden sm:inline-block">{item.confidence}%</span>
                <button
                  onClick={() => void openReport(item.id)}
                  disabled={openingId === item.id}
                  className="rounded-full border border-border-main px-4 py-2 text-sm font-medium text-text-main hover:bg-surface-muted disabled:opacity-60 transition-colors"
                >
                  {openingId === item.id ? "Opening..." : "Open Report"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && !search && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1 || isLoading}
            className="rounded-full border border-border-main bg-surface px-5 py-2 text-sm font-medium text-text-main hover:bg-surface-muted disabled:opacity-40 transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm font-medium text-text-muted">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!pagination.hasMore || isLoading}
            className="rounded-full border border-border-main bg-surface px-5 py-2 text-sm font-medium text-text-main hover:bg-surface-muted disabled:opacity-40 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function ReportView({ report }: { report: HistoryReport }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-widest text-primary-dark">Company profile</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-text-muted">Official name</p>
            <p className="mt-1.5 font-semibold text-text-main text-lg">{report.profile.canonicalName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted">Ticker</p>
            <p className="mt-1.5 font-semibold text-text-main text-lg">{report.profile.ticker ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted">Website</p>
            {report.profile.website ? (
              <a href={report.profile.website} target="_blank" rel="noreferrer"
                className="mt-1.5 block break-all text-base font-semibold text-primary hover:text-primary-dark transition-colors">
                {report.profile.website}
              </a>
            ) : (
              <p className="mt-1.5 font-semibold text-text-main text-lg">N/A</p>
            )}
          </div>
        </div>
        <p className="mt-6 text-xs text-text-muted">Generated {new Date(report.generatedAt).toLocaleString()}</p>
      </div>

      <div className="rounded-2xl border border-border-main bg-surface p-8 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">Verdict</h2>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <span className={`rounded-full px-5 py-2 text-sm font-bold ${report.verdict.verdict === "INVEST" ? "bg-[#E6F4EA] text-[#137333]" : "bg-[#FCE8E6] text-[#C5221F]"}`}>
            {report.verdict.verdict}
          </span>
          <p className="text-lg font-semibold text-text-main">Confidence: {report.verdict.confidence}%</p>
        </div>
        <ul className="mt-6 space-y-3 text-base text-text-muted leading-relaxed">
          {report.verdict.reasoning.map((r, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span> <span>{r}</span></li>)}
        </ul>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border-main bg-surface p-8 shadow-sm">
          <h3 className="font-bold text-[#137333] text-lg">Growth signals</h3>
          <ul className="mt-5 space-y-3 text-base text-text-muted leading-relaxed">
            {report.findings.growthSignals.map((s, i) => <li key={i} className="flex gap-2"><span className="text-[#137333]">•</span> <span>{s}</span></li>)}
          </ul>
        </div>
        <div className="rounded-2xl border border-border-main bg-surface p-8 shadow-sm">
          <h3 className="font-bold text-[#C5221F] text-lg">Risk signals</h3>
          <ul className="mt-5 space-y-3 text-base text-text-muted leading-relaxed">
            {report.findings.riskSignals.map((s, i) => <li key={i} className="flex gap-2"><span className="text-[#C5221F]">•</span> <span>{s}</span></li>)}
          </ul>
        </div>
      </div>

      {report.sources.length > 0 && (
        <div className="rounded-2xl border border-border-main bg-surface p-8 shadow-sm">
          <h3 className="font-bold text-text-main text-lg">Research sources</h3>
          <ul className="mt-5 space-y-3">
            {report.sources.map((src, i) => (
              <li key={i} className="flex gap-2 text-base">
                <span className="text-text-muted/40">•</span>
                <a href={src.url} target="_blank" rel="noreferrer"
                  className="text-primary hover:text-primary-dark hover:underline transition-colors leading-relaxed">
                  {src.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-center text-sm text-text-muted pb-8 pt-4">
        Educational research only. Not financial advice. Verify before making investment decisions.
      </p>
    </div>
  );
}
