import { NextResponse } from "next/server";
import { authenticateRequest, requirePermission } from "../../../../library/auth/middleware";
import { dbConnect } from "../../../../library/db/mongoose";
import ResearchResult from "../../../../library/db/models/ResearchResult";
import AuditLog from "../../../../library/db/models/AuditLog";
import UsageRecord from "../../../../library/db/models/UsageRecord";
import { handleApiError } from "../../../../library/errors/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { role } = auth;

    const permError = requirePermission(role, "admin:access");
    if (permError) return permError;

    await dbConnect();

    const today = new Date().toISOString().slice(0, 10);
    const month = new Date().toISOString().slice(0, 7);

    const [
      totalReports,
      reportsToday,
      recentReports,
      recentAuditEvents,
      dailyUsageAgg,
      monthlyUsageAgg,
    ] = await Promise.all([
      ResearchResult.countDocuments(),
      ResearchResult.countDocuments({
        createdAt: { $gte: new Date(today) },
      }),
      ResearchResult.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("userId profile.canonicalName profile.ticker verdict.verdict createdAt")
        .lean(),
      AuditLog.find()
        .sort({ timestamp: -1 })
        .limit(20)
        .lean(),
      UsageRecord.aggregate([
        { $match: { date: today } },
        {
          $group: {
            _id: null,
            totalAiCalls: { $sum: "$aiCallsToday" },
            uniqueUsers: { $addToSet: "$userId" },
          },
        },
      ]),
      UsageRecord.aggregate([
        { $match: { month } },
        {
          $group: {
            _id: null,
            totalAiCalls: { $sum: "$aiCallsToday" },
            uniqueUsers: { $addToSet: "$userId" },
          },
        },
      ]),
    ]);

    const dailyStats = dailyUsageAgg[0] ?? { totalAiCalls: 0, uniqueUsers: [] };
    const monthlyStats = monthlyUsageAgg[0] ?? { totalAiCalls: 0, uniqueUsers: [] };

    return NextResponse.json({
      success: true,
      stats: {
        reports: {
          total: totalReports,
          today: reportsToday,
        },
        usage: {
          aiCallsToday: dailyStats.totalAiCalls,
          activeUsersToday: Array.isArray(dailyStats.uniqueUsers)
            ? dailyStats.uniqueUsers.length
            : 0,
          aiCallsThisMonth: monthlyStats.totalAiCalls,
          activeUsersThisMonth: Array.isArray(monthlyStats.uniqueUsers)
            ? monthlyStats.uniqueUsers.length
            : 0,
        },
        recentReports: recentReports.map((r) => ({
          id: r._id.toString(),
          userId: r.userId,
          company: r.profile.canonicalName,
          ticker: r.profile.ticker,
          verdict: r.verdict.verdict,
          createdAt: r.createdAt.toISOString(),
        })),
        recentAuditEvents: recentAuditEvents.map((e) => ({
          id: e._id.toString(),
          actorUserId: e.actorUserId,
          actorRole: e.actorRole,
          action: e.action,
          resourceType: e.resourceType,
          resourceId: e.resourceId,
          timestamp: e.timestamp.toISOString(),
        })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
