import { END, START, StateGraph } from "@langchain/langgraph";
import { identifyCompany } from "./nodes/identify";
import { researchCompany } from "./research";
import { ResearchState } from "./state";

const workflow = new StateGraph(ResearchState)
  .addNode("identify_company", async (state) => {
    const profile = await identifyCompany(state.companyName);

    return { profile };
  })
  .addNode("research_company", async (state) => {
    const research = await researchCompany(state.companyName);

    return {
      report: research.report,
      sources: research.sources,
    };
  })
  .addNode("finalize", () => ({}))
  .addEdge(START, "identify_company")
  .addEdge(START, "research_company")
  .addEdge(["identify_company", "research_company"], "finalize")
  .addEdge("finalize", END);

export const researchGraph = workflow.compile();