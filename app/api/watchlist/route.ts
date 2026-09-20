import { NextResponse } from "next/server";
import { z } from "zod";
import { logAudit, getRequestIp, getRequestUserAgent } from "../../../library/audit/service";
import { authenticateRequest, requirePermission } from "../../../library/auth/middleware";
import { dbConnect } from "../../../library/db/mongoose";
import Watchlist from "../../../library/db/models/Watchlist";
import { handleApiError } from "../../../library/errors/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const addWatchlistSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Company name is required.")
    .max(200, "Company name must be 200 characters or fewer."),
  ticker: z
    .string()
    .trim()
    .toUpperCase()
    .max(10, "Ticker must be 10 characters or fewer.")
    .nullable()
    .optional(),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes must be 1000 characters or fewer.")
    .optional(),
  targetPrice: z
    .number()
    .positive("Target price must be a positive number.")
    .nullable()
    .optional(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, "Currency must be a 3-letter ISO code (e.g. USD).")
    .optional(),
});

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid, role } = auth;

    const permError = requirePermission(role, "watchlist:write");
    if (permError) return permError;

    await dbConnect();

    const items = await Watchlist.find({ userId: uid })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      watchlist: items.map((item) => ({
        id: item._id.toString(),
        displayName: item.displayName,
        ticker: item.ticker,
        notes: item.notes,
        targetPrice: item.targetPrice,
        currency: item.currency,
        alertEnabled: item.alertEnabled,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid, role } = auth;

    const permError = requirePermission(role, "watchlist:write");
    if (permError) return permError;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Request body must be valid JSON." } },
        { status: 400 },
      );
    }

    const parsed = addWatchlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid input.",
          },
        },
        { status: 400 },
      );
    }

    await dbConnect();

    const { displayName, ticker, notes, targetPrice, currency } = parsed.data;
    const companyName = displayName.toLowerCase().trim();

    // Check for duplicates
    const existing = await Watchlist.findOne({ userId: uid, companyName });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: `${displayName} is already in your watchlist.`,
          },
        },
        { status: 409 },
      );
    }

    const item = await Watchlist.create({
      userId: uid,
      companyName,
      displayName,
      ticker: ticker ?? null,
      notes: notes ?? "",
      targetPrice: targetPrice ?? null,
      currency: currency ?? "USD",
    });

    logAudit({
      actorUserId: uid,
      actorRole: role,
      action: "watchlist.add",
      resourceType: "Watchlist",
      resourceId: item._id.toString(),
      metadata: { displayName, ticker },
      ip: getRequestIp(request),
      userAgent: getRequestUserAgent(request),
    });

    return NextResponse.json(
      {
        success: true,
        item: {
          id: item._id.toString(),
          displayName: item.displayName,
          ticker: item.ticker,
          notes: item.notes,
          targetPrice: item.targetPrice,
          currency: item.currency,
          alertEnabled: item.alertEnabled,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
