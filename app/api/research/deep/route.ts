import { NextResponse } from "next/server";
import { z } from "zod";
import { logAudit, getRequestIp, getRequestUserAgent } from "../../../../library/audit/service";
import { authenticateRequest, requirePermission } from "../../../../library/auth/middleware";
import { dbConnect } from "../../../../library/db/mongoose";
import ResearchResult from "../../../../library/db/models/ResearchResult";
import { handleApiError } from "../../../../library/errors/handler";
import { checkQuotas, recordAIUsage } from "../../../../library/quota/service";
import { identifyCompany } from "../../../../library/agent/nodes/identify";
import { collectDeepResearchEvidence } from "../../../../library/agent/deepSearch";
import { analyseResearch } from "../../../../library/agent/analyse";
import { createVerdict } from "../../../../library/agent/verdict";

export const runtime = "nodejs";

const deepResearchRequestSchema = z.object({
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

    // 2. Check analyst+ permission
    const permError = requirePermission(role, "research:deep");
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

    const parsed = deepResearchRequestSchema.safeParse(body);
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

    // 4. Check quota
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

    // 5. Deep research pipeline: identify + 5 parallel searches + analyse + verdict
    const profile = await identifyCompany(company);
    const companyName = profile.canonicalName;

    // Collect deep evidence (5 parallel queries)
    const deepEvidence = await collectDeepResearchEvidence(companyName);

    // Combine into the standard evidence shape for the analyser
    const evidence = {
      newsAndFinancials: [
        ...deepEvidence.newsAndFinancials,
        ...deepEvidence.managementSentiment,
      ],
      competitionAndLeadership: deepEvidence.competitionAndLeadership,
      risksAndRegulation: [
        ...deepEvidence.risksAndRegulation,
        ...deepEvidence.filingsSustainability,
      ],
    };

    const [findings, ] = await Promise.all([
      analyseResearch(companyName, evidence),
    ]);

    const verdict = await createVerdict(companyName, findings);

    // De-duplicate sources
    const allSources = [
      ...deepEvidence.newsAndFinancials,
      ...deepEvidence.competitionAndLeadership,
      ...deepEvidence.risksAndRegulation,
      ...deepEvidence.filingsSustainability,
      ...deepEvidence.managementSentiment,
    ];
    const sources = Array.from(
      new Map(allSources.map((s) => [s.url, s])).values(),
    );

    // 6. Persist
    await dbConnect();
    const saved = await ResearchResult.create({
      userId: uid,
      companyQuery: company.toLowerCase().trim(),
      profile,
      findings,
      verdict,
      sources,
    });

    // 7. Record usage (only after success)
    await recordAIUsage(uid);

    // 8. Audit log
    logAudit({
      actorUserId: uid,
      actorRole: role,
      action: "research.deep",
      resourceType: "ResearchResult",
      resourceId: saved._id.toString(),
      metadata: {
        company: companyName,
        ticker: profile.ticker,
        verdict: verdict.verdict,
        sourcesCount: sources.length,
      },
      ip: getRequestIp(request),
      userAgent: getRequestUserAgent(request),
    });

    return NextResponse.json({
      success: true,
      status: "complete",
      reportType: "deep",
      role,
      reportId: saved._id.toString(),
      generatedAt: saved.createdAt.toISOString(),
      company: companyName,
      profile,
      findings,
      verdict,
      sources,
      summary: `Deep research on ${companyName} completed with ${sources.length} sources.`,
      quota: { remaining: quota.remaining - 1 },
    });
  } catch (error) {
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
