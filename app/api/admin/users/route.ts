import { NextResponse } from "next/server";
import { authenticateRequest, requirePermission } from "../../../../library/auth/middleware";
import { getAdminAuth } from "../../../../library/firebase/admin";
import { handleApiError } from "../../../../library/errors/handler";
import { USER_ROLES, type UserRole } from "../../../../library/auth/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { role } = auth;

    const permError = requirePermission(role, "admin:users");
    if (permError) return permError;

    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get("pageToken") ?? undefined;
    const maxResults = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10)),
    );

    const adminAuth = getAdminAuth();
    const listResult = await adminAuth.listUsers(maxResults, pageToken);

    const users = listResult.users.map((u) => {
      const claimedRole = (u.customClaims as Record<string, unknown> | undefined)?.role;
      const role: UserRole = USER_ROLES.includes(claimedRole as UserRole)
        ? (claimedRole as UserRole)
        : "user";
      return {
        uid: u.uid,
        email: u.email ?? null,
        displayName: u.displayName ?? null,
        photoURL: u.photoURL ?? null,
        role,
        disabled: u.disabled,
        createdAt: u.metadata.creationTime,
        lastSignIn: u.metadata.lastSignInTime ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      users,
      nextPageToken: listResult.pageToken ?? null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
