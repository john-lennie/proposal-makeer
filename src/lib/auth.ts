import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { database } from "@/db/client";
import * as schema from "@/db/schema";
import { ensureUserWorkspace } from "@/lib/auth-provisioning";
import { sendAuthEmail } from "@/lib/auth-email";
import { getAuthEnvironment } from "@/lib/env";

const authEnvironment = getAuthEnvironment();
export const isEmailDeliveryConfigured =
  Boolean(process.env.RESEND_API_KEY?.trim()) &&
  Boolean(process.env.AUTH_EMAIL_FROM?.trim());

const globalForAuthWarnings = globalThis as typeof globalThis & {
  hasWarnedAboutEmailDelivery?: boolean;
};

if (!isEmailDeliveryConfigured) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Authentication email delivery is required in production. Set RESEND_API_KEY and AUTH_EMAIL_FROM.",
    );
  }

  if (!globalForAuthWarnings.hasWarnedAboutEmailDelivery) {
    console.warn(
      "[Better Auth] Email delivery is not configured; email verification is disabled for local development.",
    );
    globalForAuthWarnings.hasWarnedAboutEmailDelivery = true;
  }
}

export const auth = betterAuth({
  appName: "Sonder",
  ...(authEnvironment.baseURL ? { baseURL: authEnvironment.baseURL } : {}),
  ...(authEnvironment.secret ? { secret: authEnvironment.secret } : {}),
  ...(authEnvironment.baseURL
    ? { trustedOrigins: [authEnvironment.baseURL] }
    : {}),
  database: drizzleAdapter(database, {
    provider: "pg",
    schema,
    transaction: true,
  }),
  user: {
    modelName: "users",
    fields: {
      image: "avatarUrl",
    },
  },
  account: {
    modelName: "accounts",
  },
  session: {
    modelName: "sessions",
  },
  verification: {
    modelName: "verifications",
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: isEmailDeliveryConfigured,
    revokeSessionsOnPasswordReset: true,
    ...(isEmailDeliveryConfigured
      ? {
          async sendResetPassword({ user, url }) {
            await sendAuthEmail({
              to: user.email,
              subject: "Reset your Sonder password",
              text: `Reset your Sonder password: ${url}`,
              html: `<p>Reset your Sonder password using the secure link below.</p><p><a href="${url}">Reset password</a></p>`,
            });
          },
        }
      : {}),
  },
  emailVerification: {
    sendOnSignUp: isEmailDeliveryConfigured,
    autoSignInAfterVerification: true,
    ...(isEmailDeliveryConfigured
      ? {
          async sendVerificationEmail({ user, url }) {
            await sendAuthEmail({
              to: user.email,
              subject: "Verify your Sonder email",
              text: `Verify your Sonder email address: ${url}`,
              html: `<p>Verify your email address to finish setting up Sonder.</p><p><a href="${url}">Verify email</a></p>`,
            });
          },
        }
      : {}),
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    database: {
      generateId: "uuid",
    },
  },
  databaseHooks: {
    user: {
      create: {
        async after(user) {
          await ensureUserWorkspace({ userId: user.id, name: user.name });
        },
      },
    },
  },
});
