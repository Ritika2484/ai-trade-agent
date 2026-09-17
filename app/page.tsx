"use client";

import { type FormEvent, useState } from "react";
type CompanyProfile = {
  canonicalName: string;
  ticker: string | null;
  website: string | null;
};
type ResearchSource = {
  title: string;
  url: string;
  snippet: string;
};

type ResearchResponse = {
  summary?: string;
  error?: string;
  profile?: CompanyProfile;
  report?: string;
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {

    event.preventDefault();

    const cleanedCompany = company.trim();

    if (!cleanedCompany) {
      setMessage("Please enter a company name first.");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setResearchResult(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

        <button className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800">
          Sign in
        </button>
      </header>

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
            disabled={isLoading}
            className="min-h-12 rounded-lg bg-cyan-400 px-6 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Researching..." : "Research company"}
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
        {researchResult?.profile && (
          <section className="mx-auto mt-8 max-w-xl rounded-xl border border-cyan-400/30 bg-slate-900 p-6 text-left">
            <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
              AI company identification
            </p>

            <dl className="mt-5 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-slate-400">Official name</dt>
                <dd className="mt-1 font-semibold text-white">
                  {researchResult.profile.canonicalName}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-slate-400">Ticker</dt>
                <dd className="mt-1 font-semibold text-white">
                  {researchResult.profile.ticker || "Not publicly traded"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-slate-400">Website</dt>
                <dd className="mt-1 break-words font-semibold text-white">
                  {researchResult.profile.website || "Unknown"}
                </dd>
              </div>
            </dl>
          </section>  
        )}
        {researchResult?.report && (
  <section className="mx-auto mt-8 max-w-4xl rounded-xl border border-slate-800 bg-slate-900 p-6 text-left">
    <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
      Research report
    </p>

    <div className="mt-5 whitespace-pre-wrap leading-7 text-slate-200">
      {researchResult.report}
    </div>

    {researchResult.sources && researchResult.sources.length > 0 && (
      <div className="mt-8 border-t border-slate-800 pt-6">
        <h2 className="text-lg font-semibold text-white">Sources</h2>

        <ul className="mt-4 space-y-3">
          {researchResult.sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-slate-800 p-4 hover:border-cyan-400"
              >
                <p className="font-medium text-cyan-400">{source.title}</p>

                {source.snippet && (
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {source.snippet}
                  </p>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
    )}
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