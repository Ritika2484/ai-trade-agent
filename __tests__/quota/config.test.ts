/**
 * Unit tests for the quota configuration.
 * Tests the ROLE_QUOTAS config object — no DB required.
 */

import { ROLE_QUOTAS } from "../../library/quota/config";
import { USER_ROLES, type UserRole } from "../../library/auth/roles";

describe("ROLE_QUOTAS configuration", () => {
  it("has a configuration for every role", () => {
    for (const role of USER_ROLES) {
      expect(ROLE_QUOTAS[role]).toBeDefined();
    }
  });

  it("user has lower limits than analyst", () => {
    expect(ROLE_QUOTAS.user.aiCallsPerDay).toBeLessThan(ROLE_QUOTAS.analyst.aiCallsPerDay);
    expect(ROLE_QUOTAS.user.aiCallsPerMonth).toBeLessThan(ROLE_QUOTAS.analyst.aiCallsPerMonth);
  });

  it("analyst has lower limits than admin", () => {
    expect(ROLE_QUOTAS.analyst.aiCallsPerDay).toBeLessThan(ROLE_QUOTAS.admin.aiCallsPerDay);
    expect(ROLE_QUOTAS.analyst.aiCallsPerMonth).toBeLessThan(ROLE_QUOTAS.admin.aiCallsPerMonth);
  });

  it("user cannot use deep research", () => {
    expect(ROLE_QUOTAS.user.deepResearchAllowed).toBe(false);
  });

  it("analyst can use deep research", () => {
    expect(ROLE_QUOTAS.analyst.deepResearchAllowed).toBe(true);
  });

  it("admin can use deep research", () => {
    expect(ROLE_QUOTAS.admin.deepResearchAllowed).toBe(true);
  });

  it("all quotas have positive limits", () => {
    for (const role of USER_ROLES) {
      const quota = ROLE_QUOTAS[role];
      expect(quota.aiCallsPerDay).toBeGreaterThan(0);
      expect(quota.aiCallsPerMonth).toBeGreaterThan(0);
      expect(quota.requestsPerMinute).toBeGreaterThan(0);
    }
  });

  it.each([...USER_ROLES] as UserRole[])(
    "%s monthly limit >= daily limit",
    (role) => {
      expect(ROLE_QUOTAS[role].aiCallsPerMonth).toBeGreaterThanOrEqual(
        ROLE_QUOTAS[role].aiCallsPerDay,
      );
    },
  );
});
