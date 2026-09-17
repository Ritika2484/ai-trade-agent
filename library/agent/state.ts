import { StateSchema } from "@langchain/langgraph";
import { z } from "zod";

export const companyProfileSchema = z.object({
  canonicalName: z.string(),
  ticker: z.string().nullable(),
  website: z.string().nullable(),
});

export const researchSourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  snippet: z.string(),
});

export const ResearchState = new StateSchema({
  companyName: z.string(),
  profile: companyProfileSchema.optional(),
  report: z.string().optional(),
  sources: z.array(researchSourceSchema).optional(),
});