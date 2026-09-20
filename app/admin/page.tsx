"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../components/AuthContext";
import { USER_ROLES, type UserRole } from "../../library/auth/roles";

type Stats = {
  reports: { total: number; today: number };
  usage: {
    aiCallsToday: number;
    activeUsersToday: number;
    aiCallsThisMonth: number;
    activeUsersThisMonth: number;
  };
  recentReports: Array<{
    id: string;
    userId: string;
    company: string;
    ticker: string | null;
    verdict: string;
    createdAt: string;
  }>;
  recentAuditEvents: Array<{
    id: string;
    actorUserId: string;
    actorRole: string;
    action: string;
    resourceType: string;
    resourceId: string | null;
    timestamp: string;
  }>;
};

type AdminUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  disabled: boolean;
  createdAt: string;
  lastSignIn: string | null;
};

export default function AdminPage() {
  const { user, loading: authLoading, getAuthToken } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "audit">("overview");
  const [roleUpdateTarget, setRoleUpdateTarget] = useState<string | null>(null);
  const [roleUpdateValue, setRoleUpdateValue] = useState<UserRole>("user");
  const [roleUpdateSuccess, setRoleUpdateSuccess] = useState("");
  const [roleUpdateError, setRoleUpdateError] = useState("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const loadStats = useCallback(async () => {
    if (!user) return;
    setIsLoadingStats(true);
    setError("");
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 403) {
        setError("Access denied. Admin permission required.");
        return;
      }
      if (!res.ok) throw new Error(data.error?.message ?? "Could not load stats.");
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load stats.");
    } finally {
      setIsLoadingStats(false);
    }
  }, [user, getAuthToken]);

  const loadUsers = useCallback(async () => {
    if (!user) return;
    setIsLoadingUsers(true);
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/admin/users?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Could not load users.");
      setUsers(data.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users.");
    } finally {
      setIsLoadingUsers(false);
    }
  }, [user, getAuthToken]);

  useEffect(() => {
    if (!authLoading && user) {
      async function run() {
        await loadStats();
        await loadUsers();
      }
      run().catch(console.error);
    }
  }, [user, authLoading, loadStats, loadUsers]);

  async function handleRoleUpdate(uid: string) {
    setIsUpdatingRole(true);
    setRoleUpdateError("");
    setRoleUpdateSuccess("");
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/admin/users/${uid}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: roleUpdateValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Could not update role.");
      setRoleUpdateSuccess(data.message ?? "Role updated.");
      setRoleUpdateTarget(null);
      setUsers((prev) =>
        prev.map((u) => u.uid === uid ? { ...u, role: roleUpdateValue } : u),
      );
    } catch (err) {
      setRoleUpdateError(err instanceof Error ? err.message : "Role update failed.");
    } finally {
      setIsUpdatingRole(false);
    }
  }

  if (authLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-muted" />)}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-5xl">🔐</p>
        <h1 className="mt-6 text-3xl font-bold text-text-main">Admin access required</h1>
        <p className="mt-3 text-lg text-text-muted">Sign in with an admin account to access this area.</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-5xl">⛔</p>
        <h1 className="mt-6 text-3xl font-bold text-text-main">Access denied</h1>
        <p className="mt-3 text-lg text-text-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 bg-background min-h-screen">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-main">Admin Dashboard</h1>
          <p className="mt-2 text-base text-text-muted">System overview and user management.</p>
        </div>
        <button
          onClick={() => { void loadStats(); void loadUsers(); }}
          className="rounded-full border border-border-main px-5 py-2 text-sm font-medium text-text-main hover:bg-surface-muted transition-colors shadow-sm"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 rounded-2xl border border-border-main bg-surface p-1.5 w-fit shadow-sm">
        {(["overview", "users", "audit"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "bg-primary text-surface shadow-sm"
                : "text-text-muted hover:text-text-main hover:bg-surface-muted/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {isLoadingStats ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-muted" />)}
            </div>
          ) : stats ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total reports" value={stats.reports.total} />
                <StatCard label="Reports today" value={stats.reports.today} />
                <StatCard label="AI calls today" value={stats.usage.aiCallsToday} />
                <StatCard label="AI calls this month" value={stats.usage.aiCallsThisMonth} />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <StatCard label="Active users today" value={stats.usage.activeUsersToday} />
                <StatCard label="Active users this month" value={stats.usage.activeUsersThisMonth} />
              </div>

              {stats.recentReports.length > 0 && (
                <div className="rounded-2xl border border-border-main bg-surface shadow-sm overflow-hidden">
                  <div className="border-b border-border-main p-5 bg-surface-muted/30">
                    <p className="font-semibold text-text-main">Recent Reports</p>
                  </div>
                  <div className="divide-y divide-border-main">
                    {stats.recentReports.map((r) => (
                      <div key={r.id} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-surface-muted/20 transition-colors">
                        <div>
                          <p className="font-semibold text-text-main">{r.company}
                            {r.ticker && <span className="ml-2 font-mono text-xs text-text-muted font-normal">({r.ticker})</span>}
                          </p>
                          <p className="text-sm text-text-muted/70 mt-1">{r.userId} <span className="mx-1.5">•</span> {new Date(r.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`self-start rounded-full px-3.5 py-1 text-xs font-bold ${r.verdict === "INVEST" ? "bg-[#E6F4EA] text-[#137333]" : "bg-[#FCE8E6] text-[#C5221F]"}`}>
                          {r.verdict}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Users */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {roleUpdateSuccess && (
            <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-200">{roleUpdateSuccess}</p>
          )}
          {roleUpdateError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">{roleUpdateError}</p>
          )}

          {isLoadingUsers ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-muted" />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-border-main bg-surface overflow-hidden shadow-sm">
              <div className="border-b border-border-main p-5 bg-surface-muted/30">
                <p className="font-semibold text-text-main">Users ({users.length})</p>
              </div>
              <div className="divide-y divide-border-main">
                {users.map((u) => (
                  <div key={u.uid} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-surface-muted/20 transition-colors">
                    <div>
                      <p className="font-semibold text-text-main text-lg">{u.displayName ?? u.email ?? u.uid}</p>
                      <p className="text-sm text-text-muted mt-1">{u.email}</p>
                      <p className="text-xs text-text-muted/60 mt-0.5">{u.uid}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        u.role === "admin" ? "bg-primary/20 text-primary-dark"
                        : u.role === "analyst" ? "bg-blue-100 text-blue-800"
                        : "bg-surface-muted text-text-muted border border-border-main"
                      }`}>
                        {u.role}
                      </span>
                      {roleUpdateTarget === u.uid ? (
                        <div className="flex items-center gap-3 bg-surface-muted/50 p-2 rounded-xl border border-border-main">
                          <select
                            value={roleUpdateValue}
                            onChange={(e) => setRoleUpdateValue(e.target.value as UserRole)}
                            className="rounded-lg border border-border-main bg-surface px-3 py-1.5 text-sm text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                          >
                            {USER_ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => void handleRoleUpdate(u.uid)}
                            disabled={isUpdatingRole}
                            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-surface hover:bg-primary-dark disabled:opacity-60 transition-colors"
                          >
                            {isUpdatingRole ? "..." : "Save"}
                          </button>
                          <button
                            onClick={() => setRoleUpdateTarget(null)}
                            className="text-sm text-text-muted hover:text-text-main transition-colors px-2"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setRoleUpdateTarget(u.uid); setRoleUpdateValue(u.role); }}
                          className="rounded-full border border-border-main px-4 py-2 text-sm font-medium text-text-main hover:bg-surface-muted transition-colors"
                        >
                          Change role
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          {isLoadingStats ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-muted" />)}
            </div>
          ) : stats?.recentAuditEvents.length ? (
            <div className="rounded-2xl border border-border-main bg-surface overflow-x-auto shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border-main bg-surface-muted/30">
                  <tr>
                    {["Action", "Actor", "Resource", "Time"].map((h) => (
                      <th key={h} className="px-5 py-4 font-semibold text-text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main">
                  {stats.recentAuditEvents.map((e) => (
                    <tr key={e.id} className="hover:bg-surface-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-primary-dark">{e.action}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-text-main font-medium text-sm truncate max-w-48">{e.actorUserId}</p>
                        <span className="mt-1 inline-block rounded bg-surface-muted px-1.5 py-0.5 text-xs font-medium text-text-muted border border-border-main">{e.actorRole}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-text-muted">
                        <span className="font-medium text-text-main">{e.resourceType}</span> {e.resourceId ? <span className="text-text-muted/60 ml-1">· {e.resourceId.slice(-8)}</span> : ""}
                      </td>
                      <td className="px-5 py-4 text-sm text-text-muted/70">
                        {new Date(e.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border-main bg-surface-muted/30 py-20 text-center">
              <p className="text-text-muted text-lg font-medium">No audit events yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border-main bg-surface p-6 shadow-sm">
      <p className="text-sm font-semibold text-text-muted uppercase tracking-wider">{label}</p>
      <p className="mt-3 text-4xl font-bold text-text-main">{value.toLocaleString()}</p>
    </div>
  );
}
