import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { authenticateRequest, requirePermission } from "../../../library/auth/middleware";
import { handleApiError } from "../../../library/errors/handler";
import ResearchResult from "../../../library/db/models/ResearchResult";
import { dbConnect } from "../../../library/db/mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // 1. Authenticate
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid, role } = auth;

    // 2. Check permission
    const permError = requirePermission(role, "history:read");
    if (permError) return permError;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("id");

    // --- Single report ---
    if (reportId) {
      if (!isValidObjectId(reportId)) {
        return NextResponse.json(
          { success: false, error: { code: "BAD_REQUEST", message: "The report ID is invalid." } },
          { status: 400 },
        );
      }

      // IDOR protection: always filter by userId
      const report = await ResearchResult.findOne({
        _id: reportId,
        userId: uid,
      }).lean();

      if (!report) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Report not found." } },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        report: {
          id: report._id.toString(),
          generatedAt: report.createdAt.toISOString(),
          company: report.profile.canonicalName,
          profile: report.profile,
          findings: report.findings,
          verdict: report.verdict,
          sources: report.sources,
        },
      });
    }

    // --- List with pagination ---
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      ResearchResult.find({ userId: uid })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("profile.canonicalName profile.ticker verdict.verdict verdict.confidence createdAt companyQuery")
        .lean(),
      ResearchResult.countDocuments({ userId: uid }),
    ]);

    return NextResponse.json({
      success: true,
      history: reports.map((report) => ({
        id: report._id.toString(),
        company: report.profile.canonicalName,
        ticker: report.profile.ticker,
        companyQuery: report.companyQuery,
        verdict: report.verdict.verdict,
        confidence: report.verdict.confidence,
        generatedAt: report.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}