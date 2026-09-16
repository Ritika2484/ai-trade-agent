"use client";

import { type FormEvent, useState } from "react";

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

export default function Home() {
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedCompany = company.trim();

    if (!cleanedCompany) {
      setMessage("Please enter a company name first.");
      return;
    }

    setMessage(`"${cleanedCompany}" is ready for research.`);
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
            placeholder="Try Apple, NVIDIA, or Tesla"
            className="min-h-12 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
          />

          <button
            type="submit"
            className="min-h-12 rounded-lg bg-cyan-400 px-6 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Research company
          </button>
        </form>

        <p className="mt-3 text-sm text-slate-500" aria-live="polite">
          {message || "Enter a company to start a research request."}
        </p>
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
    </main>
  );
}