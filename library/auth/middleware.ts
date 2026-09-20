import type { DecodedIdToken } from "firebase-admin/auth";
import { NextResponse } from "next/server";
import { getAdminAuth } from "../firebase/admin";
import { getUserRole, hasPermission, type Permission, type UserRole } from "./roles";

export type AuthenticatedRequest = {
  uid: string;
  role: UserRole;
  decodedToken: DecodedIdToken;
};

/**
 * Verifies the Bearer token in the Authorization header.
 * Returns the authenticated user info or a NextResponse error.
 *
 * Usage:
 *   const auth = await authenticateRequest(request);
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.uid, auth.role, auth.decodedToken
 */
export async function authenticateRequest(
  request: Request,
): Promise<AuthenticatedRequest | NextResponse> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Unauthorized. Please sign in before making this request.",
        },
      },
      { status: 401 },
    );
  }

  const idToken = authHeader.slice(7);

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    const role = getUserRole(decodedToken);

    return { uid: decodedToken.uid, role, decodedToken };
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Unauthorized. Your session is invalid or expired.",
        },
      },
      { status: 401 },
    );
  }
}

/**
 * Checks that an authenticated user has the required permission.
 * Returns a 403 NextResponse if not, or null if allowed.
 */
export function requirePermission(
  role: UserRole,
  permission: Permission,
): NextResponse | null {
  if (!hasPermission(role, permission)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Your account does not have the '${permission}' permission.`,
        },
      },
      { status: 403 },
    );
  }
  return null;
}
