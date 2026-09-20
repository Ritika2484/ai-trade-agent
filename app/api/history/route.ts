import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { getUserRole, hasPermission } from "../../../library/auth/roles";
import ResearchResult from "../../../library/db/models/ResearchResult";
import { dbConnect } from "../../../library/db/mongoose";
import { getAdminAuth } from "../../../library/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in first." },
      { status: 401 },
    );
  }

  try {
    const idToken = authHeader.slice(7);
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    const role = getUserRole(decodedToken);

    if (!hasPermission(role, "history:read")) {
      return NextResponse.json(
        { error: "Your account does not have permission to view history." },
        { status: 403 },
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("id");

    if (reportId) {
      if (!isValidObjectId(reportId)) {
        return NextResponse.json(
          { error: "The report ID is invalid." },
          { status: 400 },
        );
      }

      const report = await ResearchResult.findOne({
        _id: reportId,
        userId: decodedToken.uid,
      }).lean();

      if (!report) {
        return NextResponse.json(
          { error: "Report not found." },
          { status: 404 },
        );
      }

      return NextResponse.json({
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

    const reports = await ResearchResult.find({
      userId: decodedToken.uid,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      history: reports.map((report) => ({
        id: report._id.toString(),
        company: report.profile.canonicalName,
        ticker: report.profile.ticker,
        verdict: report.verdict.verdict,
        confidence: report.verdict.confidence,
        generatedAt: report.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Could not load research history:", error);

    return NextResponse.json(
      { error: "Research history is temporarily unavailable." },
      { status: 500 },
    );
  }
}