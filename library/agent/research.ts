import Groq from "groq-sdk";

export type ResearchSource = {
  title: string;
  url: string;
  snippet: string;
};

export type ResearchReport = {
  report: string;
  sources: ResearchSource[];
};

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function researchCompany(
  companyName: string,
): Promise<ResearchReport> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing from .env.local.");
  }

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    temperature: 0.2,
    max_completion_tokens: 4096,
    reasoning_effort: "low",
    tool_choice: "required",
    tools: [{ type: "browser_search" }],
    messages: [
      {
        role: "system",
        content:
          "You are an equity-research assistant. Produce educational research, not personal investment advice. Separate facts from interpretation, state uncertainty, and never invent financial figures or sources.",
      },
      {
        role: "user",
        content: `Research ${companyName}. Cover recent material news, business model, financial signals, competitors, and key risks. Use current web sources. Use concise Markdown headings and bullet points.`,
      },
    ],
  });

  const message = completion.choices[0]?.message;
  const report = message?.content?.trim();

  if (!report) {
    throw new Error("The research model returned an empty report.");
  }

  const sources = (message?.executed_tools ?? []).flatMap((tool) => [
    ...(tool.search_results?.results ?? []).flatMap((source) =>
      source.url
        ? [
            {
              title: source.title ?? "Untitled source",
              url: source.url,
              snippet: source.content ?? "",
            },
          ]
        : [],
    ),
    ...(tool.browser_results ?? []).map((source) => ({
      title: source.title,
      url: source.url,
      snippet: source.content ?? "",
    })),
  ]);

  const uniqueSources = Array.from(
  new Map(sources.map((source) => [source.url, source])).values(),
);

return { report, sources: uniqueSources };
}