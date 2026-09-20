import type { UserRole } from "../auth/roles";

export type QuotaConfig = {
  /** Max AI research requests per day */
  aiCallsPerDay: number;
  /** Max AI research requests per month */
  aiCallsPerMonth: number;
  /** Max HTTP requests per minute (simple rate limiting) */
  requestsPerMinute: number;
  /** Whether deep research is allowed */
  deepResearchAllowed: boolean;
};

/**
 * Role-based quota configuration.
 * Change these values here — do not scatter limits across routes.
 */
export const ROLE_QUOTAS: Record<UserRole, QuotaConfig> = {
  user: {
    aiCallsPerDay: 5,
    aiCallsPerMonth: 30,
    requestsPerMinute: 10,
    deepResearchAllowed: false,
  },
  analyst: {
    aiCallsPerDay: 20,
    aiCallsPerMonth: 200,
    requestsPerMinute: 30,
    deepResearchAllowed: true,
  },
  admin: {
    aiCallsPerDay: 100,
    aiCallsPerMonth: 1000,
    requestsPerMinute: 60,
    deepResearchAllowed: true,
  },
};
