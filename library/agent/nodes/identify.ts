import { ChatGroq } from "@langchain/groq";
import { z } from "zod";

const companyProfileSchema = z.object({
  canonicalName: z.string().describe("The official company name."),
  ticker: z
    .string()
    .nullable()
    .describe("The main public stock ticker, or null if it is not publicly traded."),
  website: z
    .string()
    .nullable()
    .describe("The official company website, or null if it is unknown."),
});

export type CompanyProfile = z.infer<typeof companyProfileSchema>;

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-20b",
  temperature: 0,
});

const structuredModel = model.withStructuredOutput(companyProfileSchema, {
  name: "company_profile",
});

export async function identifyCompany(
  companyName: string,
): Promise<CompanyProfile> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing from .env.local.");
  }

  return structuredModel.invoke([
    {
      role: "system",
      content:
        "You identify companies for an investment-research application. Return only accurate company identity information. Do not invent a stock ticker or website.",
    },
    {
      role: "user",
      content: `Identify this company: ${companyName}`,
    },
  ]);
}