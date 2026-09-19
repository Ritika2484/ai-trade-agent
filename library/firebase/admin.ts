import type { Auth } from "firebase-admin/auth";

let adminAuth: Auth | null = null;

export function getAdminAuth(): any {
  if (adminAuth) {
    return adminAuth;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin credentials are missing.");
  }

  const { cert, getApp, getApps, initializeApp } = require("firebase-admin/app");
  const { getAuth } = require("firebase-admin/auth");

  const formattedPrivateKey = privateKey
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n");

  const adminApp =
    getApps().length === 0
      ? initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: formattedPrivateKey,
          }),
        })
      : getApp();

  adminAuth = getAuth(adminApp);

  return adminAuth;
}