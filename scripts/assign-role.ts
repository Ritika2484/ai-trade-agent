/**
 * Role assignment CLI script.
 * Usage: npx ts-node --project tsconfig.json scripts/assign-role.ts <email> <role>
 *
 * This script uses Firebase Admin SDK to set custom claims.
 * It requires FIREBASE_ADMIN_* environment variables to be set.
 *
 * Run from the project root:
 *   npx ts-node --project tsconfig.json scripts/assign-role.ts user@example.com admin
 */

// Load env vars from .env.local (Next.js doesn't load them for scripts)
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { USER_ROLES, type UserRole } from "../library/auth/roles";

async function main() {
  const [, , email, role] = process.argv;

  if (!email || !role) {
    console.error("Usage: assign-role.ts <email> <role>");
    console.error(`Valid roles: ${USER_ROLES.join(", ")}`);
    process.exit(1);
  }

  if (!USER_ROLES.includes(role as UserRole)) {
    console.error(`Invalid role '${role}'. Valid roles: ${USER_ROLES.join(", ")}`);
    process.exit(1);
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      "Missing Firebase Admin credentials. Ensure FIREBASE_ADMIN_PROJECT_ID, " +
      "FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY are set in .env.local.",
    );
    process.exit(1);
  }

  const formattedKey = privateKey
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n");

  const app =
    getApps().length === 0
      ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey: formattedKey }) })
      : getApp();

  const adminAuth = getAuth(app);

  try {
    const user = await adminAuth.getUserByEmail(email);
    const previousRole = (user.customClaims as { role?: string })?.role ?? "user";

    await adminAuth.setCustomUserClaims(user.uid, { role });

    console.log(`✅ Role assigned successfully.`);
    console.log(`   User:    ${email} (${user.uid})`);
    console.log(`   Role:    ${previousRole} → ${role}`);
    console.log(`   Note: The user must sign out and sign back in for the new role to take effect.`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("no user record")) {
      console.error(`❌ No user found with email: ${email}`);
    } else {
      console.error("❌ Failed to assign role:", msg);
    }
    process.exit(1);
  }
}

void main();
