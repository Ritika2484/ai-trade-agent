"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "./AuthContext";
import { ROLE_LABELS, type UserRole } from "../library/auth/roles";

const NAV_LINKS = [
  { label: "Research", href: "/" },
  { label: "History", href: "/history" },
  { label: "Watchlist", href: "/watchlist" },
];

export function Navbar() {
  const { user, loading, signInWithGoogle, signOutUser, getAuthToken } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authError, setAuthError] = useState("");
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Lazily load role from token claims when profile is opened
  async function loadRole() {
    if (userRole || !user) return;
    try {
      const token = await getAuthToken();
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]!));
        const role = payload.role as UserRole | undefined;
        setUserRole(role ?? "user");
      }
    } catch {
      setUserRole("user");
    }
  }

  async function handleSignIn() {
    setAuthError("");
    try {
      await signInWithGoogle();
    } catch {
      setAuthError("Google sign-in failed. Please try again.");
    }
  }

  async function handleSignOut() {
    setProfileOpen(false);
    setUserRole(null);
    setAuthError("");
    try {
      await signOutUser();
    } catch {
      setAuthError("Sign out failed. Please try again.");
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border-main bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-black text-surface">
            AI
          </span>
          <span className="text-base font-bold text-text-main">Trade Research</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text-main"
            >
              {link.label}
            </a>
          ))}
          {user && (
            <a
              href="/admin"
              id="admin-nav-link"
              className="rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-muted"
            >
              Admin
            </a>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-surface-muted" />
          ) : user ? (
            <div className="relative">
              <button
                id="profile-menu-btn"
                onClick={() => { setProfileOpen(!profileOpen); void loadRole(); }}
                className="flex items-center gap-2 rounded-lg border border-border-main px-3 py-2 text-sm hover:bg-surface-muted transition-colors"
              >
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt="Profile"
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-surface">
                    {(user.displayName ?? user.email ?? "U")[0]?.toUpperCase()}
                  </span>
                )}
                <span className="hidden max-w-32 truncate text-text-main sm:block">
                  {user.displayName ?? user.email ?? "Account"}
                </span>
                <svg
                  className={`h-4 w-4 text-text-muted transition-transform ${profileOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 z-50 min-w-56 rounded-xl border border-border-main bg-surface shadow-xl">
                  <div className="border-b border-border-main p-4">
                    <p className="text-sm font-semibold text-text-main truncate">
                      {user.displayName ?? "Researcher"}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted truncate">{user.email}</p>
                    {userRole && (
                      <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary-dark">
                        {ROLE_LABELS[userRole]}
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <button
                      id="sign-out-btn"
                      onClick={() => void handleSignOut()}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="sign-in-btn"
              onClick={() => void handleSignIn()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface hover:bg-primary-dark transition-colors"
            >
              Sign in with Google
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-text-muted hover:bg-surface-muted md:hidden transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-border-main bg-surface px-6 pb-4 pt-2 md:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted hover:bg-surface-muted hover:text-text-main transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          {user && (
            <a
              href="/admin"
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-primary hover:bg-surface-muted transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Admin
            </a>
          )}
        </div>
      )}

      {authError && (
        <p className="bg-red-50 px-6 py-2 text-center text-sm text-red-600 border-t border-red-100">{authError}</p>
      )}

      {/* Close dropdown on outside click */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setProfileOpen(false)}
        />
      )}
    </nav>
  );
}
