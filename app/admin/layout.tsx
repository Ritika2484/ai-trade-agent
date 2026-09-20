import { cookies } from "next/headers";
import { getAdminAuth } from "../../library/firebase/admin";
import { requirePermission } from "../../library/auth/middleware";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/"); // No auth
  }

  let isAuthorized = false;

  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    const role = (decodedToken.role as "user" | "analyst" | "admin") || "user";
    
    // Use the same server-side permission check we use for API endpoints
    const permError = requirePermission(role, "admin:access");
    if (!permError) {
      isAuthorized = true;
    }
  } catch (error) {
    console.error("Failed to verify token for admin layout:", error);
    redirect("/");
  }

  if (!isAuthorized) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-5xl">⛔</p>
        <h1 className="mt-6 text-3xl font-bold text-text-main">Access denied</h1>
        <p className="mt-3 text-lg text-text-muted">Server-side verification failed: Admin permission required.</p>
      </div>
    );
  }

  return <>{children}</>;
}
