import type { DecodedIdToken } from "firebase-admin/auth";

export const USER_ROLES = ["user", "analyst", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type Permission =
  | "research:basic"
  | "research:deep"
  | "history:read"
  | "watchlist:write"
  | "admin:access"
  | "admin:users"
  | "quota:manage";

const permissionsByRole: Record<UserRole, Permission[]> = {
  user: ["research:basic", "history:read", "watchlist:write"],

  analyst: [
    "research:basic",
    "research:deep",
    "history:read",
    "watchlist:write",
  ],

  admin: [
    "research:basic",
    "research:deep",
    "history:read",
    "watchlist:write",
    "admin:access",
    "admin:users",
    "quota:manage",
  ],
};

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export function getUserRole(decodedToken: DecodedIdToken): UserRole {
  return isUserRole(decodedToken.role) ? decodedToken.role : "user";
}

export function hasPermission(
  role: UserRole,
  permission: Permission,
): boolean {
  return permissionsByRole[role].includes(permission);
}

/**
 * Human-readable role labels for display in the UI.
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  user: "Researcher",
  analyst: "Analyst",
  admin: "Administrator",
};