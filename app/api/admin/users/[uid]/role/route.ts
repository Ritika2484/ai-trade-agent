import { NextResponse } from "next/server";
import { z } from "zod";
import { logAudit, getRequestIp, getRequestUserAgent } from "../../../../../../library/audit/service";
import { authenticateRequest, requirePermission } from "../../../../../../library/auth/middleware";
import { getAdminAuth } from "../../../../../../library/firebase/admin";
import { USER_ROLES } from "../../../../../../library/auth/roles";
import { handleApiError } from "../../../../../../library/errors/handler";

export const runtime = "nodejs";

const roleUpdateSchema = z.object({
  role: z.enum([...USER_ROLES], {
    error: () => `Role must be one of: ${USER_ROLES.join(", ")}`,
  }),
});

type Params = { params: Promise<{ uid: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { uid: targetUid } = await params;

    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid: actorUid, role: actorRole } = auth;

    const permError = requirePermission(actorRole, "admin:users");
    if (permError) return permError;

    // Prevent self-demotion
    if (actorUid === targetUid) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "You cannot change your own role." },
        },
        { status: 403 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Request body must be valid JSON." } },
        { status: 400 },
      );
    }

    const parsed = roleUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid role.",
          },
        },
        { status: 400 },
      );
    }

    const { role: newRole } = parsed.data;
    const adminAuth = getAdminAuth();

    // Verify target user exists
    const targetUser = await adminAuth.getUser(targetUid);

    // Set custom claim
    await adminAuth.setCustomUserClaims(targetUid, { role: newRole });

    // Audit log
    logAudit({
      actorUserId: actorUid,
      actorRole: actorRole,
      action: "role.assign",
      resourceType: "User",
      resourceId: targetUid,
      metadata: {
        targetEmail: targetUser.email ?? null,
        newRole,
        previousRole: (targetUser.customClaims as { role?: string })?.role ?? "user",
      },
      ip: getRequestIp(request),
      userAgent: getRequestUserAgent(request),
    });

    return NextResponse.json({
      success: true,
      message: `Role updated to '${newRole}' for user ${targetUid}.`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("no user record")) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found." } },
        { status: 404 },
      );
    }
    return handleApiError(error);
  }
}
