import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { logAudit, getRequestIp, getRequestUserAgent } from "../../../../library/audit/service";
import { authenticateRequest, requirePermission } from "../../../../library/auth/middleware";
import { dbConnect } from "../../../../library/db/mongoose";
import Watchlist from "../../../../library/db/models/Watchlist";
import { handleApiError } from "../../../../library/errors/handler";

export const runtime = "nodejs";

const updateWatchlistSchema = z.object({
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
  alertEnabled: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid watchlist item ID." } },
        { status: 400 },
      );
    }

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

    const parsed = updateWatchlistSchema.safeParse(body);
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

    // IDOR protection: filter by userId
    const item = await Watchlist.findOneAndUpdate(
      { _id: id, userId: uid },
      { $set: parsed.data },
      { new: true },
    ).lean();

    if (!item) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Watchlist item not found." } },
        { status: 404 },
      );
    }

    logAudit({
      actorUserId: uid,
      actorRole: role,
      action: "watchlist.update",
      resourceType: "Watchlist",
      resourceId: id,
      metadata: { changes: parsed.data },
      ip: getRequestIp(request),
      userAgent: getRequestUserAgent(request),
    });

    return NextResponse.json({
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
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid watchlist item ID." } },
        { status: 400 },
      );
    }

    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid, role } = auth;

    const permError = requirePermission(role, "watchlist:write");
    if (permError) return permError;

    await dbConnect();

    // IDOR protection: filter by userId
    const item = await Watchlist.findOneAndDelete({ _id: id, userId: uid }).lean();

    if (!item) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Watchlist item not found." } },
        { status: 404 },
      );
    }

    logAudit({
      actorUserId: uid,
      actorRole: role,
      action: "watchlist.remove",
      resourceType: "Watchlist",
      resourceId: id,
      metadata: { displayName: item.displayName, ticker: item.ticker },
      ip: getRequestIp(request),
      userAgent: getRequestUserAgent(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
