import { NextResponse } from "next/server";
import { z } from "zod";
import { researchGraph } from "../../../library/agent/graph";

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

  const company = parsedRequest.data.company;

  try {
    const result = await researchGraph.invoke({
      companyName: company,
    });

    if (!result.profile || !result.report) {
      throw new Error("Research workflow returned an incomplete result.");
    }

    return NextResponse.json({
      company,
      profile: result.profile,
      report: result.report,
      sources: result.sources ?? [],
      status: "complete",
      summary: `${result.profile.canonicalName} research completed.`,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Company research failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown research error.";

    if (errorMessage.includes("rate_limit_exceeded")) {
      return NextResponse.json(
        {
          error:
            "AI quota is temporarily exhausted. Please wait a few minutes and try again.",
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "AI research could not run. Check the server terminal." },
      { status: 500 },
    );
  }
}