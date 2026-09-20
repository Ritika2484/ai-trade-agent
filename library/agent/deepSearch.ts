import { searchWeb } from "./search";
import type { ResearchEvidence } from "./search";

/**
 * Deep research evidence collection — analyst tier.
 * Runs 5 parallel Tavily queries for richer evidence vs. 3 for basic research.
 * All queries are factual; no data is invented.
 */
export async function collectDeepResearchEvidence(
  companyName: string,
): Promise<ResearchEvidence & {
  filingsSustainability: ReturnType<typeof searchWeb> extends Promise<infer T> ? T : never[];
  managementSentiment: ReturnType<typeof searchWeb> extends Promise<infer T> ? T : never[];
}> {
  const [
    newsAndFinancials,
    competitionAndLeadership,
    risksAndRegulation,
    filingsSustainability,
    managementSentiment,
  ] = await Promise.all([
    searchWeb(`${companyName} latest news earnings revenue profit financial results 2024 2025`),
    searchWeb(`${companyName} competitors market share strategy CEO leadership expansion`),
    searchWeb(`${companyName} risks regulation lawsuit debt supply chain litigation`),
    searchWeb(`${companyName} annual report SEC filing ESG sustainability 10-K investor relations`),
    searchWeb(`${companyName} management outlook guidance forecast analyst opinion`),
  ]);

  return {
    newsAndFinancials,
    competitionAndLeadership,
    risksAndRegulation,
    filingsSustainability,
    managementSentiment,
  };
}
