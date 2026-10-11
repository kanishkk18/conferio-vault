import { betterAuth, APIError } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin as adminPlugin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { createAuthMiddleware } from "better-auth/api";
import { prisma } from "@securevault/database";
import { serverEnv } from "./env";
import { adminLoginRateLimiter, getClientIp } from "./rate-limit";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: serverEnv.BETTER_AUTH_SECRET,
  baseURL: serverEnv.ADMIN_APP_URL,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // admin accounts are provisioned by a trusted operator, not self-service
  },

  session: {
    expiresIn: 60 * 60 * 8, // 8 hours — shorter-lived than the consumer app on purpose
    updateAge: 60 * 60,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  advanced: {
    cookiePrefix: "securevault-admin",
    useSecureCookies: serverEnv.NODE_ENV === "production",
  },

  user: {
    additionalFields: {
      masterKeySalt: { type: "string", required: false, input: false },
    },
  },

  plugins: [
    adminPlugin({ adminRoles: ["admin"], defaultRole: "user" }),
    nextCookies(),
  ],

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Admin accounts are promoted, never created here.
      if (ctx.path === "/sign-up/email") {
        throw new APIError("FORBIDDEN", {
          message: "Self-registration isn't available for the admin panel.",
        });
      }

      if (ctx.path === "/sign-in/email") {
        const ip = getClientIp(ctx.headers ?? new Headers());
        const { success } = await adminLoginRateLimiter.limit(`admin-login:${ip}`);
        if (!success) {
          throw new APIError("TOO_MANY_REQUESTS", {
            message: "Too many login attempts. Please try again later.",
          });
        }
      }
    }),

    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;

      const newSession = ctx.context.newSession;
      if (!newSession?.user) return;

      if (newSession.user.role !== "admin") {
        // Authenticated successfully but isn't an admin — revoke the
        // session immediately rather than letting a valid cookie sit
        // around for an account that shouldn't have one here.
        await prisma.session.delete({ where: { id: newSession.session.id } }).catch(() => {});
        throw new APIError("FORBIDDEN", {
          message: "This account doesn't have admin access.",
        });
      }

      await prisma.auditLog.create({
        data: {
          userId: newSession.user.id,
          action: "admin_login",
          ipAddress: getClientIp(ctx.headers ?? new Headers()),
          userAgent: ctx.headers?.get("user-agent") ?? undefined,
        },
      });
    }),
  },
});

export type AdminSession = typeof auth.$Infer.Session;
