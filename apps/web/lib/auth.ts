import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin as adminPlugin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { prisma } from "@securevault/database";
import { serverEnv } from "./env.server";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";
import { loginRateLimiter, registerRateLimiter, getClientIp } from "./rate-limit";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: serverEnv.BETTER_AUTH_SECRET,
  baseURL: serverEnv.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    autoSignIn: false, // require explicit sign-in after registration/verification
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
  },

  socialProviders: {
    google: {
      clientId: serverEnv.GOOGLE_CLIENT_ID,
      clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
      // Google accounts arrive pre-verified by Google itself
      mapProfileToUser: (profile) => ({
        emailVerified: profile.email_verified ?? false,
      }),
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once per day of activity
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes — avoids a DB round-trip on every request
    },
  },

  advanced: {
    cookiePrefix: "securevault",
    useSecureCookies: serverEnv.NODE_ENV === "production",
    disableCSRFCheck: false,
  },

  // Custom fields beyond what Better Auth's core schema provides.
  user: {
    additionalFields: {
      masterKeySalt: {
        type: "string",
        required: false,
        input: true, // client sets this at registration, before the password leaves the browser
      },
      publicKey: {
        type: "string",
        required: false,
        input: false, // set via POST /api/user/keypair, not at registration
      },
      lastLoginAt: { type: "date", required: false, input: false },
      loginCount: { type: "number", required: false, defaultValue: 0, input: false },
      ipAddress: { type: "string", required: false, input: false },
    },
  },

  plugins: [
    adminPlugin({
      adminRoles: ["admin"],
      defaultRole: "user",
      impersonationSessionDuration: 60 * 15, // 15 minutes, for admin support flows
    }),
    // Must be last so its cookie-setting hook sees the final response.
    nextCookies(),
  ],

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const ip = getClientIp(ctx.headers ?? new Headers());

      if (ctx.path === "/sign-in/email") {
        const { success } = await loginRateLimiter.limit(`login:${ip}`);
        if (!success) {
          throw new APIError("TOO_MANY_REQUESTS", {
            message: "Too many login attempts. Please try again in a few minutes.",
          });
        }
      }

      if (ctx.path === "/sign-up/email") {
        const { success } = await registerRateLimiter.limit(`register:${ip}`);
        if (!success) {
          throw new APIError("TOO_MANY_REQUESTS", {
            message: "Too many registration attempts from this network. Please try again later.",
          });
        }
      }
    }),

    after: createAuthMiddleware(async (ctx) => {
      // Track successful sign-ins for the admin dashboard (last login, count, IP).
      if (ctx.path === "/sign-in/email" || ctx.path.startsWith("/callback/")) {
        const newSession = ctx.context.newSession;
        if (newSession?.user) {
          const ip = getClientIp(ctx.headers ?? new Headers());
          await prisma.user.update({
            where: { id: newSession.user.id },
            data: {
              lastLoginAt: new Date(),
              loginCount: { increment: 1 },
              ipAddress: ip,
            },
          });
          await prisma.auditLog.create({
            data: {
              userId: newSession.user.id,
              action: "login",
              ipAddress: ip,
              userAgent: ctx.headers?.get("user-agent") ?? undefined,
            },
          });
        }
      }
    }),
  },
});

export type Session = typeof auth.$Infer.Session;
