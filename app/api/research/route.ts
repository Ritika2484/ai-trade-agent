import { NextResponse } from "next/server";
import { z } from "zod";
import { identifyCompany } from "../../../library/agent/nodes/identify";

const researchRequestSchema = z.object({
  company: z.string().trim().min(1, "Company name is required.").max(100),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsedRequest = researchRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "Please provide a company name of up to 100 characters." },
      { status: 400 },
    );
  }

  try {
    const profile = await identifyCompany(parsedRequest.data.company);

    return NextResponse.json({
      company: parsedRequest.data.company,
      profile,
      status: "complete",
      summary: `${profile.canonicalName} identified successfully.${profile.ticker ? ` Ticker: ${profile.ticker}.` : ""
        }`,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Company identification failed:", error);

    return NextResponse.json(
      { error: " Sorry...,AI research could not run. Check your GROQ_API_KEY and server terminal." },
      { status: 500 },
    );
  }
}