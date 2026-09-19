import { StateSchema } from "@langchain/langgraph";
import { z } from "zod";

const sourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  content: z.string(),
});

const profileSchema = z.object({
  canonicalName: z.string(),
  ticker: z.string().nullable(),
  website: z.string().nullable(),
});

const evidenceSchema = z.object({
  newsAndFinancials: z.array(sourceSchema),
  competitionAndLeadership: z.array(sourceSchema),
  risksAndRegulation: z.array(sourceSchema),
});

const findingsSchema = z.object({
  growthSignals: z.array(z.string()),
  riskSignals: z.array(z.string()),
  competitivePosition: z.string(),
  financialHealth: z.string(),
  keyDevelopments: z.array(z.string()),
  sources: z.array(z.string().url()),
});

const verdictSchema = z.object({
  verdict: z.enum(["INVEST", "PASS"]),
  confidence: z.number().min(0).max(100),
  reasoning: z.array(z.string()),
  keyRisks: z.array(z.string()),
  keyOpportunities: z.array(z.string()),
});

export const ResearchState = new StateSchema({
  companyName: z.string(),

  profile: profileSchema.optional(),
  evidence: evidenceSchema.optional(),
  findings: findingsSchema.optional(),
  verdict: verdictSchema.optional(),

  sources: z.array(sourceSchema).optional(),
});