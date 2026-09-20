/**
 * Tests for RBAC roles and permissions.
 * These run without database or Firebase — pure unit tests.
 */

import {
  getUserRole,
  hasPermission,
  USER_ROLES,
  type UserRole,
  type Permission,
} from "../../library/auth/roles";
import type { DecodedIdToken } from "firebase-admin/auth";

function makeToken(role?: string): DecodedIdToken {
  return {
    role,
    uid: "test-uid",
    aud: "test",
    auth_time: 0,
    exp: 9999999999,
    iat: 0,
    iss: "test",
    sub: "test-uid",
    firebase: { identities: {}, sign_in_provider: "google.com" },
  } as unknown as DecodedIdToken;
}

describe("getUserRole", () => {
  it("returns 'user' when no role claim is set", () => {
    expect(getUserRole(makeToken())).toBe("user");
  });

  it("returns 'user' when role claim is an unknown value", () => {
    expect(getUserRole(makeToken("superadmin"))).toBe("user");
  });

  it.each(USER_ROLES)("returns '%s' when role claim is '%s'", (role) => {
    expect(getUserRole(makeToken(role))).toBe(role);
  });
});

describe("hasPermission", () => {
  const permissionMatrix: Record<UserRole, { allowed: Permission[]; denied: Permission[] }> = {
    user: {
      allowed: ["research:basic", "history:read", "watchlist:write"],
      denied: ["research:deep", "admin:access", "admin:users", "quota:manage"],
    },
    analyst: {
      allowed: ["research:basic", "research:deep", "history:read", "watchlist:write"],
      denied: ["admin:access", "admin:users", "quota:manage"],
    },
    admin: {
      allowed: [
        "research:basic",
        "research:deep",
        "history:read",
        "watchlist:write",
        "admin:access",
        "admin:users",
        "quota:manage",
      ],
      denied: [],
    },
  };

  for (const [role, { allowed, denied }] of Object.entries(permissionMatrix) as [
    UserRole,
    { allowed: Permission[]; denied: Permission[] },
  ][]) {
    for (const perm of allowed) {
      it(`${role} has permission '${perm}'`, () => {
        expect(hasPermission(role, perm)).toBe(true);
      });
    }
    for (const perm of denied) {
      it(`${role} does NOT have permission '${perm}'`, () => {
        expect(hasPermission(role, perm)).toBe(false);
      });
    }
  }

  it("user cannot access admin:access", () => {
    expect(hasPermission("user", "admin:access")).toBe(false);
  });

  it("user cannot perform deep research", () => {
    expect(hasPermission("user", "research:deep")).toBe(false);
  });

  it("analyst can perform deep research", () => {
    expect(hasPermission("analyst", "research:deep")).toBe(true);
  });

  it("analyst cannot access admin endpoints", () => {
    expect(hasPermission("analyst", "admin:access")).toBe(false);
    expect(hasPermission("analyst", "admin:users")).toBe(false);
  });

  it("admin can access everything", () => {
    expect(hasPermission("admin", "admin:access")).toBe(true);
    expect(hasPermission("admin", "admin:users")).toBe(true);
    expect(hasPermission("admin", "quota:manage")).toBe(true);
    expect(hasPermission("admin", "research:deep")).toBe(true);
  });
});
