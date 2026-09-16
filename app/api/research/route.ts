import { NextResponse } from "next/server";
import { z } from "zod";

const researchRequestSchema = z.object({
  company: z.string().trim().min(1, "Company name is required.").max(100),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    const parsedRequest = researchRequestSchema.safeParse(body);

    if (!parsedRequest.success) {
      return NextResponse.json(
        { error: "Please provide a company name of up to 100 characters." },
        { status: 400 },
      );
    }

    const { company } = parsedRequest.data;

    return NextResponse.json({
      company,
      status: "complete",
      summary: `Mock research result for ${company}. AI research will be connected in a later step.`,
      generatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "The request body must be valid JSON." },
      { status: 400 },
    );
  }
}