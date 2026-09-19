import { NextResponse } from "next/server";
import { z } from "zod";
import { researchGraph } from "../../../library/agent/graph";
import { getAdminAuth } from "../../../library/firebase/admin";

export const runtime = "nodejs";

const researchRequestSchema = z.object({
  company: z.string().trim().min(1, "Company name is required.").max(100),
});

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in before starting research." },
      { status: 401 },
    );
  }

  const idToken = authHeader.slice(7);

  try {
    await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json(
      { error: "Unauthorized. Your sign-in session is invalid or expired." },
      { status: 401 },
    );
  }

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

    if (
      !result.profile ||
      !result.findings ||
      !result.verdict ||
      !result.sources
    ) {
      throw new Error("The research workflow returned an incomplete result.");
    }

    return NextResponse.json({
      status: "complete",
      generatedAt: new Date().toISOString(),
      company: result.profile.canonicalName,
      profile: result.profile,
      findings: result.findings,
      verdict: result.verdict,
      sources: result.sources,
      summary: `${result.profile.canonicalName} research completed.`,
    });
  } catch (error) {
    console.error("Company research failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown research error.";

    if (errorMessage.includes("rate_limit_exceeded")) {
      return NextResponse.json(
        {
          error:
            "The AI research quota is temporarily exhausted. Please try again shortly.",
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