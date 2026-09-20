import { NextResponse } from "next/server";
import { z } from "zod";
import { researchGraph } from "../../../library/agent/graph";
import { logAudit, getRequestIp, getRequestUserAgent } from "../../../library/audit/service";
import { authenticateRequest, requirePermission } from "../../../library/auth/middleware";
import { dbConnect } from "../../../library/db/mongoose";
import ResearchResult from "../../../library/db/models/ResearchResult";
import { handleApiError } from "../../../library/errors/handler";
import { checkQuotas, recordAIUsage } from "../../../library/quota/service";

export const runtime = "nodejs";

const researchRequestSchema = z.object({
  company: z
    .string()
    .trim()
    .min(1, "Company name is required.")
    .max(100, "Company name must be 100 characters or fewer."),
});

export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid, role } = auth;

    // 2. Check permission
    const permError = requirePermission(role, "research:basic");
    if (permError) return permError;

    // 3. Validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { code: "BAD_REQUEST", message: "The request body must be valid JSON." },
        },
        { status: 400 },
      );
    }

    const parsed = researchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Please provide a company name of up to 100 characters." },
        },
        { status: 400 },
      );
    }

    const company = parsed.data.company;

    // 4. Check quota (daily + monthly)
    const quota = await checkQuotas(uid, role);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "RATE_LIMITED", message: quota.reason },
          remaining: 0,
        },
        { status: 429 },
      );
    }

    // 5. Run AI research pipeline
    const result = await researchGraph.invoke({ companyName: company });

    if (!result.profile || !result.findings || !result.verdict || !result.sources) {
      throw new Error("The research workflow returned an incomplete result.");
    }

    // 6. Persist to MongoDB
    await dbConnect();
    const saved = await ResearchResult.create({
      userId: uid,
      companyQuery: company.toLowerCase().trim(),
      profile: result.profile,
      findings: result.findings,
      verdict: {
        ...result.verdict,
        verdict: result.verdict.verdict.toUpperCase().trim() as "INVEST" | "PASS",
      },
      sources: result.sources,
    });

    // 7. Record AI usage (only after successful research)
    await recordAIUsage(uid);

    // 8. Audit log (fire-and-forget)
    logAudit({
      actorUserId: uid,
      actorRole: role,
      action: "research.create",
      resourceType: "ResearchResult",
      resourceId: saved._id.toString(),
      metadata: {
        company: result.profile.canonicalName,
        ticker: result.profile.ticker,
        verdict: result.verdict.verdict,
      },
      ip: getRequestIp(request),
      userAgent: getRequestUserAgent(request),
    });

    return NextResponse.json({
      success: true,
      status: "complete",
      role,
      reportId: saved._id.toString(),
      generatedAt: saved.createdAt.toISOString(),
      company: result.profile.canonicalName,
      profile: result.profile,
      findings: result.findings,
      verdict: result.verdict,
      sources: result.sources,
      summary: `${result.profile.canonicalName} research completed.`,
      quota: { remaining: quota.remaining - 1 },
    });
  } catch (error) {
    // Groq rate limit passthrough
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("rate_limit_exceeded")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "The AI research quota is temporarily exhausted. Please try again shortly.",
          },
        },
        { status: 429 },
      );
    }

    return handleApiError(error);
  }
}