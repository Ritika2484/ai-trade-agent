import {Annotation} from '@langchain/langgraph';
import z from 'zod';//library for schema validation

export interface ICanonicalEntity{
    name:string,
    ticker?:string,
    domain?:string

}
export interface ITavilyResult{//purana ....duckduckgo use kre for seraching
    title:string;
    url:string;
    content:string;
}

//annotation root degines the structure of the data that will be passed between nodes in the graph
export const AgentAnnotation = Annotation.Root({// .root help to make state 
    companyName: Annotation<string>(),
    cannocialEntity: Annotation<ICanonicalEntity>(),

    newsResults:Annotation<string[]>({
        reducer:(left,right)=>(right?left.concat(right):left),
        default:()=>[]
        //reducer is used to combine multiple values into a single value. In this case, it concatenates the arrays of news results from different nodes in the graph.
        // remaining nodes of research..
    })

})