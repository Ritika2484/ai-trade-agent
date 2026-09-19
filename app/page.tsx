"use client";

import { type FormEvent, useState } from "react";
import { useAuth } from "../components/AuthContext";
type CompanyProfile = {
  canonicalName: string;
  ticker: string | null;
  website: string | null;
};


type ResearchSource = {
  title: string;
  url: string;
  content: string;
};

type ResearchResponse = {
  status?: "complete";
  generatedAt?: string;
  company?: string;
  summary?: string;
  error?: string;

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
  const [researchResult, setResearchResult] =
    useState<ResearchResponse | null>(null);
  const {
  user,
  loading: authLoading,
  signInWithGoogle,
  signOutUser,
  getAuthToken,
} = useAuth();
  const [authError, setAuthError] = useState("");
  async function handleSignIn() {
    setAuthError("");

    try {
      await signInWithGoogle();
    } catch {
      setAuthError("Google sign-in failed. Please try again.");
    }
  }

  async function handleSignOut() {
    setAuthError("");

    try {
      await signOutUser();
    } catch {
      setAuthError("Sign out failed. Please try again.");
    }
  }

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
  } catch {
    setMessage("Could not connect to the research server.");
  } finally {
    setIsLoading(false);
  }
}

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <p className="text-lg font-bold tracking-tight">AI Trade Research</p>

        {authLoading ? (
          <p className="text-sm text-slate-400">Checking account...</p>
        ) : user ? (
          <div className="flex items-center gap-3">
            <p className="max-w-40 truncate text-sm text-slate-300">
              {user.displayName || user.email || "Signed in"}
            </p>

            <button
              onClick={handleSignOut}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800"
          >
            Sign in with Google
          </button>
        )}
      </header>
      {authError && (
        <p className="mx-auto max-w-6xl px-6 text-sm text-red-400">{authError}</p>
      )}

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
          AI-powered equity research
        </p>

        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Research a company before you invest.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Enter a company name and receive a structured research report with
          financial signals, market risks, competitors, and cited sources.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="Try Apple, NVIDIA, or Dell"
            className="min-h-12 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
          />

          <button
  type="submit"
  disabled={isLoading || authLoading || !user}
  className="min-h-12 rounded-lg bg-cyan-400 px-6 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
>
  {isLoading
    ? "Researching..."
    : user
      ? "Research company"
      : "Sign in to research"}
</button>
        </form>

        <p className="mt-3 text-sm text-slate-500" aria-live="polite">
          {isLoading
            ? "Your request is being sent to the research server."
            : message || "Enter a company to start a research request."}
        </p>
        {isLoading && (
          <section className="mx-auto mt-8 max-w-xl rounded-xl border border-cyan-400/30 bg-slate-900 p-6 text-left">
            <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
              Research in progress
            </p>

            <ol className="mt-5 space-y-3">
              {researchStages.map((stage) => (
                <li key={stage} className="flex items-center gap-3 text-slate-300">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-400" />
                  {stage}
                </li>
              ))}
            </ol>

            <p className="mt-5 text-sm leading-6 text-slate-500">
              These are the steps the system performs. Live per-step completion will be
              added later with server-sent events.
            </p>
          </section>
        )}
        {researchResult?.profile &&
  researchResult.findings &&
  researchResult.verdict && (
    <section className="mx-auto max-w-4xl space-y-6 px-6 pb-20">
      <div className="rounded-xl border border-cyan-700 bg-slate-900 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
          Company profile
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <p className="text-sm text-slate-400">Official name</p>
            <p className="mt-1 font-semibold text-white">
              {researchResult.profile.canonicalName}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-400">Ticker</p>
            <p className="mt-1 font-semibold text-white">
              {researchResult.profile.ticker || "Not identified"}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-400">Website</p>

            {researchResult.profile.website ? (
              <a
                href={researchResult.profile.website}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block break-all font-semibold text-cyan-400 hover:text-cyan-300"
              >
                {researchResult.profile.website}
              </a>
            ) : (
              <p className="mt-1 font-semibold text-white">Not identified</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
          Research verdict
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <span
            className={`rounded-full px-4 py-2 text-sm font-bold ${
              researchResult.verdict.verdict === "INVEST"
                ? "bg-emerald-400 text-emerald-950"
                : "bg-rose-400 text-rose-950"
            }`}
          >
            {researchResult.verdict.verdict}
          </span>

          <p className="text-lg font-semibold text-white">
            Confidence: {researchResult.verdict.confidence}%
          </p>
        </div>

        <ul className="mt-5 space-y-2 text-slate-300">
          {researchResult.verdict.reasoning.map((reason, index) => (
            <li key={`${reason}-${index}`}>• {reason}</li>
          ))}
        </ul>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="font-semibold text-emerald-400">Growth signals</h2>

          <ul className="mt-4 space-y-3 text-slate-300">
            {researchResult.findings.growthSignals.map((signal, index) => (
              <li key={`${signal}-${index}`}>• {signal}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="font-semibold text-rose-400">Risk signals</h2>

          <ul className="mt-4 space-y-3 text-slate-300">
            {researchResult.findings.riskSignals.map((risk, index) => (
              <li key={`${risk}-${index}`}>• {risk}</li>
            ))}
          </ul>
        </article>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="font-semibold text-white">Competitive position</h2>
          <p className="mt-3 leading-7 text-slate-300">
            {researchResult.findings.competitivePosition}
          </p>
        </article>

        <article className="rounded-xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="font-semibold text-white">Financial health</h2>
          <p className="mt-3 leading-7 text-slate-300">
            {researchResult.findings.financialHealth}
          </p>
        </article>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="font-semibold text-amber-400">Key opportunities</h2>

          <ul className="mt-4 space-y-3 text-slate-300">
            {researchResult.verdict.keyOpportunities.map((opportunity, index) => (
              <li key={`${opportunity}-${index}`}>• {opportunity}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="font-semibold text-rose-400">Key risks</h2>

          <ul className="mt-4 space-y-3 text-slate-300">
            {researchResult.verdict.keyRisks.map((risk, index) => (
              <li key={`${risk}-${index}`}>• {risk}</li>
            ))}
          </ul>
        </article>
      </div>

      {researchResult.sources && researchResult.sources.length > 0 && (
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="font-semibold text-white">Research sources</h2>

          <ul className="mt-4 space-y-3">
            {researchResult.sources.map((source, index) => (
              <li key={`${source.url}-${index}`}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </article>
      )}

      {researchResult.generatedAt && (
        <p className="text-center text-sm text-slate-500">
          Fresh research generated:{" "}
          {new Date(researchResult.generatedAt).toLocaleString()}
        </p>
      )}

      <p className="text-center text-xs leading-6 text-slate-500">
        Educational research only. This is not personal financial or investment
        advice. Always verify information before making an investment decision.
      </p>
    </section>
  )}
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-20 md:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-left"
          >
            <h2 className="text-lg font-semibold text-white">{feature.title}</h2>

            <p className="mt-3 leading-7 text-slate-400">
              {feature.description}
            </p>
          </article>
        ))}
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <aside className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-5 text-sm leading-6 text-amber-100">
          <p className="font-semibold">Important research disclaimer</p>

          <p className="mt-2 text-amber-100/80">
            This application provides educational, AI-assisted research only. It is
            not financial, investment, tax, or legal advice. Verify every important
            claim using the linked sources before making financial decisions.
          </p>
        </aside>
      </section>

    </main>
  );
}