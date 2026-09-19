import { END, START, StateGraph } from "@langchain/langgraph";
import { analyseResearch } from "./analyse";
import { identifyCompany } from "./nodes/identify";
import { collectResearchEvidence } from "./search";
import { ResearchState } from "./state";
import { createVerdict } from "./verdict";

const workflow = new StateGraph(ResearchState)
  .addNode("identify_company", async (state) => {
    const profile = await identifyCompany(state.companyName);

    return { profile };
  })

  .addNode("search_current_web", async (state) => {
    const companyName = state.profile?.canonicalName ?? state.companyName;

    const evidence = await collectResearchEvidence(companyName);

    return { evidence };
  })

  .addNode("analyse_evidence", async (state) => {
    if (!state.evidence) {
      throw new Error("Research evidence is missing.");
    }

    const findings = await analyseResearch(
      state.profile?.canonicalName ?? state.companyName,
      state.evidence,
    );

    return { findings };
  })

  .addNode("create_verdict", async (state) => {
    if (!state.findings) {
      throw new Error("Research findings are missing.");
    }

    const verdict = await createVerdict(
      state.profile?.canonicalName ?? state.companyName,
      state.findings,
    );

    return { verdict };
  })

  .addNode("finalize_sources", (state) => {
    if (!state.evidence) {
      throw new Error("Research evidence is missing.");
    }

    const allSources = [
      ...state.evidence.newsAndFinancials,
      ...state.evidence.competitionAndLeadership,
      ...state.evidence.risksAndRegulation,
    ];

    const uniqueSources = Array.from(
      new Map(allSources.map((source) => [source.url, source])).values(),
    );

    return { sources: uniqueSources };
  })

  .addEdge(START, "identify_company")
  .addEdge("identify_company", "search_current_web")
  .addEdge("search_current_web", "analyse_evidence")
  .addEdge("analyse_evidence", "create_verdict")
  .addEdge("create_verdict", "finalize_sources")
  .addEdge("finalize_sources", END);

export const researchGraph = workflow.compile();