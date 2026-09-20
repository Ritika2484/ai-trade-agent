"use client";

import { type FormEvent, useState } from "react";
import { useAuth } from "../components/AuthContext";
import { HistoryPanel } from "../components/HistoryPanel";
import type { HistoryReport } from "../components/HistoryPanel";
import { WatchlistPanel } from "../components/WatchlistPanel";
import { MarketCard } from "../components/MarketCard";

type ResearchSource = {
  title: string;
  url: string;
  content: string;
};

type ResearchResponse = {
  success?: boolean;
  status?: "complete";
  generatedAt?: string;
  company?: string;
  summary?: string;
  error?: string;
  reportId?: string;
  quota?: { remaining: number };

  profile?: {
    canonicalName: string;
    ticker: string | null;
    website: string | null;
  };

  findings?: {
    growthSignals: string[];
    riskSignals: string[];
    competitivePosition: string;
    financialHealth: string;
    keyDevelopments: string[];
    sources: string[];
  };

  verdict?: {
    verdict: "INVEST" | "PASS";
    confidence: number;
    reasoning: string[];
    keyRisks: string[];
    keyOpportunities: string[];
  };

  sources?: ResearchSource[];
};

const features = [
  {
    title: "Company research",
    description: "Collect news, financial signals, risks, and competitor information.",
  },
  {
    title: "Clear verdicts",
    description: "Turn research into a structured investment thesis and confidence score.",
  },
  {
    title: "Source-backed insights",
    description: "Keep links to the sources used in every research report.",
  },
];

const researchStages = [
  "Checking the company identity",
  "Searching current web sources",
  "Reviewing business and financial signals",
  "Organizing findings and citations",
];

export default function Home() {
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [researchResult, setResearchResult] = useState<ResearchResponse | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [addToWatchlistPrefill, setAddToWatchlistPrefill] = useState<{
    displayName: string;
    ticker?: string | null;
  } | null>(null);

  const { user, loading: authLoading, getAuthToken } = useAuth();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedCompany = company.trim();

    if (!cleanedCompany) {
      setMessage("Please enter a company name first.");
      return;
    }

    if (!user) {
      setMessage("Please sign in with Google before starting research.");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setResearchResult(null);

    try {
      const token = await getAuthToken();

      if (!token) {
        setMessage("Your sign-in session has expired. Please sign in again.");
        return;
      }

      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ company: cleanedCompany }),
      });

      const data: ResearchResponse = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Research request failed.");
        return;
      }

      setResearchResult(data);
      setMessage(data.summary || "Research completed successfully.");
      // Refresh history panel after successful research
      setHistoryRefreshKey((k) => k + 1);
    } catch {
      setMessage("Could not connect to the research server.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenReport(report: HistoryReport) {
    setResearchResult({
      status: "complete",
      generatedAt: report.generatedAt,
      company: report.company,
      summary: `${report.company} research loaded from history.`,
      profile: report.profile,
      findings: report.findings,
      verdict: report.verdict,
      sources: report.sources,
    });
    setMessage(`${report.company} report loaded from history.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      {/* Hero section */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-text-main sm:text-7xl mb-6">
          Research smarter.<br/>Understand companies faster.
        </h1>

        <p className="mx-auto max-w-2xl text-lg leading-8 text-text-muted mb-10">
          AI-powered company research with verified sources, <br/>
          structured insights and actionable analysis.
        </p>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="mx-auto flex max-w-2xl flex-col sm:flex-row shadow-sm rounded-full overflow-hidden border border-border-main bg-surface focus-within:ring-2 focus-within:ring-primary/50 transition-all"
        >
          <div className="flex flex-1 items-center px-6">
            <span className="text-text-muted text-xl mr-3">🔍</span>
            <input
              id="company-input"
              type="text"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Search a company, ticker or research topic..."
              className="min-h-16 flex-1 bg-transparent text-text-main text-lg outline-none placeholder:text-text-muted/60"
            />
          </div>
          
          <div className="p-2 w-full sm:w-auto bg-surface">
            <button
              id="research-submit-btn"
              type="submit"
              disabled={isLoading || authLoading || !user}
              className="w-full sm:w-auto min-h-12 rounded-full bg-primary px-8 text-base font-semibold text-surface hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              {isLoading
                ? "Researching..."
                : user
                ? "Start Research"
                : "Sign in"}
            </button>
          </div>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm text-text-muted">
          <span className="mr-2">Popular Research:</span>
          {["NVIDIA", "Apple", "Microsoft", "Tesla"].map((preset) => (
            <button
              key={preset}
              onClick={() => setCompany(preset)}
              className="rounded-full border border-border-main bg-surface px-4 py-1.5 hover:bg-surface-muted transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>

        <p className="mt-6 text-sm text-text-muted" aria-live="polite">
          {isLoading
            ? "Your request is being processed by the AI research agent."
            : message}
        </p>

        {user && researchResult?.quota && (
          <p className="mt-2 text-xs text-text-muted">
            {researchResult.quota.remaining} research{" "}
            {researchResult.quota.remaining === 1 ? "request" : "requests"} remaining today.
          </p>
        )}

        {/* Research in progress */}
        {isLoading && (
          <section className="mx-auto mt-12 max-w-xl rounded-2xl border border-border-main bg-surface p-8 text-left shadow-sm">
            <h3 className="text-xl font-bold text-text-main mb-6 flex items-center gap-3">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
              Researching {company || "company"}...
            </h3>

            <ol className="space-y-4">
              {researchStages.map((stage, i) => (
                <li key={stage} className="flex items-center gap-4 text-text-muted">
                  {/* Simulate progress: top half done, middle doing, bottom pending */}
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs
                    ${i < 1 ? "bg-primary text-surface" : i === 1 ? "bg-surface-muted text-primary border border-primary" : "border border-border-main text-border-main"}
                  `}>
                    {i < 1 ? "✓" : i === 1 ? "●" : "○"}
                  </span>
                  <span className={i === 1 ? "text-text-main font-medium" : ""}>
                    {stage}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </section>

      {/* Research result */}
      {researchResult?.profile && researchResult.findings && researchResult.verdict && (
        <section className="mx-auto max-w-4xl space-y-6 px-6 pb-20">
          {/* Company profile */}
          <div className="rounded-2xl border border-border-main bg-surface p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wider text-text-muted mb-6">
              Company profile
            </p>
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <p className="text-sm text-text-muted">Official name</p>
                <p className="mt-1 font-semibold text-text-main text-lg">
                  {researchResult.profile.canonicalName}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Ticker</p>
                <p className="mt-1 font-semibold text-text-main text-lg">
                  {researchResult.profile.ticker ?? "Not identified"}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Website</p>
                {researchResult.profile.website ? (
                  <a
                    href={researchResult.profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block break-all font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    {researchResult.profile.website}
                  </a>
                ) : (
                  <p className="mt-1 font-semibold text-text-main">Not identified</p>
                )}
              </div>
            </div>

            {/* Add to watchlist button */}
            {user && researchResult.profile && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  id="add-to-watchlist-btn"
                  onClick={() => {
                    setAddToWatchlistPrefill({
                      displayName: researchResult.profile!.canonicalName,
                      ticker: researchResult.profile!.ticker,
                    });
                    // Scroll to watchlist section
                    setTimeout(() => {
                      document.getElementById("watchlist-section")?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                  className="rounded-full border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
                >
                  + Add to watchlist
                </button>

                {/* Market card for identified ticker */}
                {researchResult.profile.ticker && (
                  <div className="w-full sm:w-auto">
                    <MarketCard ticker={researchResult.profile.ticker} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Verdict */}
          <div className="rounded-2xl border border-border-main bg-surface p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wider text-text-muted">
              AI Summary & Verdict
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <span
                className={`rounded-full px-5 py-2 text-sm font-bold ${
                  researchResult.verdict.verdict === "INVEST"
                    ? "bg-[#E6F4EA] text-[#137333]"
                    : "bg-[#FCE8E6] text-[#C5221F]"
                }`}
              >
                {researchResult.verdict.verdict}
              </span>
              <p className="text-lg font-semibold text-text-main">
                Confidence: {researchResult.verdict.confidence}%
              </p>
            </div>
            <ul className="mt-6 space-y-3 text-text-muted text-lg leading-relaxed">
              {researchResult.verdict.reasoning.map((reason, index) => (
                <li key={`${reason}-${index}`}>• {reason}</li>
              ))}
            </ul>
          </div>

          {/* Growth / Risk signals */}
          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-border-main bg-surface p-6 shadow-sm">
              <h2 className="font-semibold text-text-main flex items-center gap-2">
                <span className="text-[#137333]">↑</span> Growth signals
              </h2>
              <ul className="mt-4 space-y-3 text-text-muted">
                {researchResult.findings.growthSignals.map((signal, index) => (
                  <li key={`${signal}-${index}`}>• {signal}</li>
                ))}
              </ul>
            </article>
            <article className="rounded-2xl border border-border-main bg-surface p-6 shadow-sm">
              <h2 className="font-semibold text-text-main flex items-center gap-2">
                <span className="text-[#C5221F]">↓</span> Risk signals
              </h2>
              <ul className="mt-4 space-y-3 text-text-muted">
                {researchResult.findings.riskSignals.map((risk, index) => (
                  <li key={`${risk}-${index}`}>• {risk}</li>
                ))}
              </ul>
            </article>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-border-main bg-surface p-6 shadow-sm">
              <h2 className="font-semibold text-text-main">Competitive position</h2>
              <p className="mt-3 leading-relaxed text-text-muted">
                {researchResult.findings.competitivePosition}
              </p>
            </article>
            <article className="rounded-2xl border border-border-main bg-surface p-6 shadow-sm">
              <h2 className="font-semibold text-text-main">Financial health</h2>
              <p className="mt-3 leading-relaxed text-text-muted">
                {researchResult.findings.financialHealth}
              </p>
            </article>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-border-main bg-surface p-6 shadow-sm">
              <h2 className="font-semibold text-text-main">Key opportunities</h2>
              <ul className="mt-4 space-y-3 text-text-muted">
                {researchResult.verdict.keyOpportunities.map((opportunity, index) => (
                  <li key={`${opportunity}-${index}`}>• {opportunity}</li>
                ))}
              </ul>
            </article>
            <article className="rounded-2xl border border-border-main bg-surface p-6 shadow-sm">
              <h2 className="font-semibold text-text-main">Key risks</h2>
              <ul className="mt-4 space-y-3 text-text-muted">
                {researchResult.verdict.keyRisks.map((risk, index) => (
                  <li key={`${risk}-${index}`}>• {risk}</li>
                ))}
              </ul>
            </article>
          </div>

          {researchResult.sources && researchResult.sources.length > 0 && (
            <article className="rounded-2xl border border-border-main bg-surface p-6 shadow-sm">
              <h2 className="font-semibold text-text-main">Research sources</h2>
              <ul className="mt-4 space-y-3">
                {researchResult.sources.map((source, index) => (
                  <li key={`${source.url}-${index}`} className="flex items-start gap-2 text-text-muted">
                    <span className="text-primary mt-0.5">↳</span>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-primary transition-colors hover:underline"
                    >
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          )}

          {researchResult.generatedAt && (
            <p className="text-center text-sm text-text-muted">
              Research generated:{" "}
              {new Date(researchResult.generatedAt).toLocaleString()}
            </p>
          )}

          <p className="text-center text-xs leading-6 text-text-muted/60">
            Educational research only. This is not personal financial or investment
            advice. Always verify information before making an investment decision.
          </p>
        </section>
      )}

      {/* History section (quick panel on home) */}
      {user && (
        <HistoryPanel
          refreshKey={historyRefreshKey}
          onOpenReport={handleOpenReport}
        />
      )}

      {/* Watchlist section */}
      {user && (
        <div id="watchlist-section">
          <WatchlistPanel prefill={addToWatchlistPrefill ?? undefined} />
        </div>
      )}

      {/* Feature cards */}
      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-20 md:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-2xl border border-border-main bg-surface p-6 text-left shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-text-main">{feature.title}</h2>
            <p className="mt-3 leading-7 text-text-muted">{feature.description}</p>
          </article>
        ))}
      </section>

      {/* Disclaimer */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <aside className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm leading-6 text-text-muted">
          <p className="font-semibold text-primary-dark">Important research disclaimer</p>
          <p className="mt-2 text-text-muted/80">
            This application provides educational, AI-assisted research only. It is
            not financial, investment, tax, or legal advice. Verify every important
            claim using the linked sources before making financial decisions.
          </p>
        </aside>
      </section>
    </>
  );
}