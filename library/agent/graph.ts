import { StateGraph,START,END } from '@langchain/langgraph';
const workflow = new StateGraph(AgentAnnotation)
.addNode('identify',identifyNode)
.addNode('research_news',researchNewsNode)
.addNode('research_risks',researchRisksNode)
.addNode('research_competitors',researchCompetitorsNode)
.addNode('research_regulations',researchRegulationsNode)
.addNode('research_finance',researchFinanceNode)
.addNode('analyse',analyseNode)
.addNode('decide',decideNode);

workflow.addEdge(START,'identify');//fanin and fanout 

workflow.addEdge('identify','research_news');
workflow.addEdge('identify','research_risks');
workflow.addEdge('identify','research_competitors');
workflow.addEdge('identify','research_regulations');
workflow.addEdge('identify','research_finance');

workflow.addEdge('research_news','analyse');
workflow.addEdge('research_risks','analyse');
workflow.addEdge('research_competitors','analyse');
workflow.addEdge('research_regulations','analyse');
workflow.addEdge('research_finance','analyse');

workflow.addEdge('analyse','decide');
workflow.addEdge('decide',END);
export const graph =workflow.compile();//compile runs the graph



