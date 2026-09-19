import Groq from "groq-sdk";
import type { ResearchEvidence } from "./search";

export type ResearchFindings = {
  growthSignals: string[];
  riskSignals: string[];
  competitivePosition: string;
  financialHealth: string;
  keyDevelopments: string[];
  sources: string[];
};

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing in .env.local.");
  }

  return new Groq({ apiKey });
}

function getEvidenceText(evidence: ResearchEvidence) {
  return JSON.stringify(evidence, null, 2);
}

function extractJson(text: string): string {
  return text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
}

export async function analyseResearch(
  companyName: string,
  evidence: ResearchEvidence,
): Promise<ResearchFindings> {
  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    temperature: 0.2,
    max_completion_tokens: 1200,
    reasoning_effort: "low",
    messages: [
      {
        role: "user",
        content: `You are an equity-research analyst.

Use ONLY the web evidence below to analyse ${companyName}.
This is educational research, not financial advice.
Never invent facts, numbers, dates, or sources.

Return ONLY valid JSON. Do not use Markdown.

Use exactly this shape:
{
  "growthSignals": ["fact-based signal", "fact-based signal"],
  "riskSignals": ["fact-based risk", "fact-based risk"],
  "competitivePosition": "Short evidence-based explanation.",
  "financialHealth": "Short evidence-based explanation.",
  "keyDevelopments": ["important recent development"],
  "sources": ["https://source-url.com"]
}

WEB EVIDENCE:
${getEvidenceText(evidence)}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("The analysis model returned no findings.");
  }

  try {
    return JSON.parse(extractJson(content)) as ResearchFindings;
  } catch {
    throw new Error("The analysis model returned invalid JSON.");
  }
}