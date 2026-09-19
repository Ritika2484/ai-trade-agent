import Groq from "groq-sdk";
import type { ResearchFindings } from "./analyse";

export type ResearchVerdict = {
  verdict: "INVEST" | "PASS";
  confidence: number;
  reasoning: string[];
  keyRisks: string[];
  keyOpportunities: string[];
};

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing in .env.local.");
  }

  return new Groq({ apiKey });
}

function extractJson(text: string): string {
  return text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
}

function calculateFallbackConfidence(findings: ResearchFindings): number {
  const sourceCount = new Set(findings.sources).size;

  const detailCount =
    findings.growthSignals.length +
    findings.riskSignals.length +
    findings.keyDevelopments.length;

  return Math.min(85, Math.max(40, 35 + sourceCount * 7 + Math.min(detailCount, 5) * 2));
}

export async function createVerdict(
  companyName: string,
  findings: ResearchFindings,
): Promise<ResearchVerdict> {
  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    temperature: 0.1,
    max_completion_tokens: 700,
    reasoning_effort: "low",
    messages: [
      {
        role: "user",
        content: `Create an educational research stance for ${companyName}.

Use ONLY these findings. Do not invent facts.
This is not personal investment advice.
"INVEST" means the available evidence is broadly positive.
"PASS" means the risks or uncertainty outweigh the available positive evidence.

Confidence means confidence in the AVAILABLE EVIDENCE, not the probability of making profit.
Choose an integer from 20 to 85.
Never return 0. Never leave a placeholder.

Return ONLY valid JSON, with exactly this shape:
{
  "verdict": "INVEST",
  "confidence": 68,
  "reasoning": ["reason one", "reason two", "reason three"],
  "keyRisks": ["risk one", "risk two"],
  "keyOpportunities": ["opportunity one", "opportunity two"]
}

FINDINGS:
${JSON.stringify(findings, null, 2)}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("The verdict model returned no result.");
  }

  try {
    const result = JSON.parse(extractJson(content)) as ResearchVerdict;

    const hasValidConfidence =
      Number.isInteger(result.confidence) &&
      result.confidence >= 20 &&
      result.confidence <= 85;

    return {
      ...result,
      confidence: hasValidConfidence
        ? result.confidence
        : calculateFallbackConfidence(findings),
    };
  } catch {
    throw new Error("The verdict model returned invalid JSON.");
  }
}