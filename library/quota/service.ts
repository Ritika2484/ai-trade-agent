import type { UserRole } from "../auth/roles";
import UsageRecord from "../db/models/UsageRecord";
import { dbConnect } from "../db/mongoose";
import { ROLE_QUOTAS } from "./config";

function getDateKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getMonthKey(): string {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

export type QuotaResult =
  | { allowed: true; remaining: number }
  | { allowed: false; reason: string; remaining: 0 };

/**
 * Check daily AI call quota for a user.
 * Does NOT modify the database — read-only check.
 */
export async function checkDailyQuota(
  userId: string,
  role: UserRole,
): Promise<QuotaResult> {
  const limit = ROLE_QUOTAS[role].aiCallsPerDay;
  await dbConnect();

  const record = await UsageRecord.findOne({
    userId,
    date: getDateKey(),
  }).lean();

  const used = record?.aiCallsToday ?? 0;

  if (used >= limit) {
    return {
      allowed: false,
      reason: `Daily AI research limit reached (${limit} per day for your plan). Resets tomorrow.`,
      remaining: 0,
    };
  }

  return { allowed: true, remaining: limit - used };
}

/**
 * Check monthly AI call quota for a user.
 * Aggregates across all daily records for the current month.
 */
export async function checkMonthlyQuota(
  userId: string,
  role: UserRole,
): Promise<QuotaResult> {
  const limit = ROLE_QUOTAS[role].aiCallsPerMonth;
  await dbConnect();

  const month = getMonthKey();

  const agg = await UsageRecord.aggregate<{ total: number }>([
    { $match: { userId, month } },
    { $group: { _id: null, total: { $sum: "$aiCallsToday" } } },
  ]);

  const used = agg[0]?.total ?? 0;

  if (used >= limit) {
    return {
      allowed: false,
      reason: `Monthly AI research limit reached (${limit} per month for your plan). Resets next month.`,
      remaining: 0,
    };
  }

  return { allowed: true, remaining: limit - used };
}

/**
 * Run both daily and monthly quota checks.
 * Returns the first failure, or allowed if both pass.
 */
export async function checkQuotas(
  userId: string,
  role: UserRole,
): Promise<QuotaResult> {
  const [daily, monthly] = await Promise.all([
    checkDailyQuota(userId, role),
    checkMonthlyQuota(userId, role),
  ]);

  if (!daily.allowed) return daily;
  if (!monthly.allowed) return monthly;

  // Return the more restrictive remaining count
  return { allowed: true, remaining: Math.min(daily.remaining, monthly.remaining) };
}

/**
 * Atomically increment AI usage counters.
 * Uses $inc + upsert to avoid race conditions.
 * Only call this AFTER a successful AI research call.
 */
export async function recordAIUsage(userId: string): Promise<void> {
  await dbConnect();

  const date = getDateKey();
  const month = getMonthKey();

  await UsageRecord.findOneAndUpdate(
    { userId, date },
    {
      $inc: { aiCallsToday: 1, aiCallsThisMonth: 1 },
      $set: { month, lastRequestAt: new Date() },
    },
    { upsert: true },
  );
}

/**
 * Get current usage stats for a user (for display in UI or admin).
 */
export async function getUserUsageStats(
  userId: string,
  role: UserRole,
): Promise<{
  today: number;
  thisMonth: number;
  dailyLimit: number;
  monthlyLimit: number;
}> {
  await dbConnect();

  const date = getDateKey();
  const month = getMonthKey();

  const [todayRecord, monthAgg] = await Promise.all([
    UsageRecord.findOne({ userId, date }).lean(),
    UsageRecord.aggregate<{ total: number }>([
      { $match: { userId, month } },
      { $group: { _id: null, total: { $sum: "$aiCallsToday" } } },
    ]),
  ]);

  const quotas = ROLE_QUOTAS[role];

  return {
    today: todayRecord?.aiCallsToday ?? 0,
    thisMonth: monthAgg[0]?.total ?? 0,
    dailyLimit: quotas.aiCallsPerDay,
    monthlyLimit: quotas.aiCallsPerMonth,
  };
}
