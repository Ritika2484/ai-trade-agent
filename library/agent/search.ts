import { tavily } from "@tavily/core";

export type ResearchSource = {
  title: string;
  url: string;
  content: string;
};

const MAX_CONTENT_LENGTH = 650;

function getTavilyClient() {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is missing in .env.local.");
  }

  return tavily({ apiKey });
}

export async function searchWeb(query: string): Promise<ResearchSource[]> {
  const client = getTavilyClient();

  const response = await client.search(query, {
    searchDepth: "basic",
    maxResults: 2,
    includeAnswer: false,
    includeRawContent: false,
  });

  return response.results.map((result) => ({
    title: result.title,
    url: result.url,
    content: result.content.slice(0, MAX_CONTENT_LENGTH),
  }));
}
export type ResearchEvidence = {
  newsAndFinancials: ResearchSource[];
  competitionAndLeadership: ResearchSource[];
  risksAndRegulation: ResearchSource[];
};

export async function collectResearchEvidence(
  companyName: string,
): Promise<ResearchEvidence> {
  const [
    newsAndFinancials,
    competitionAndLeadership,
    risksAndRegulation,
  ] = await Promise.all([
    searchWeb(
      `${companyName} latest news earnings revenue profit financial results`,
    ),
    searchWeb(
      `${companyName} competitors market share strategy CEO leadership`,
    ),
    searchWeb(
      `${companyName} risks regulation lawsuit debt supply chain`,
    ),
  ]);

  return {
    newsAndFinancials,
    competitionAndLeadership,
    risksAndRegulation,
  };
}