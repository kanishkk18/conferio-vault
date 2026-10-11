import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { clientEnv } from "./env.client";

export const authClient = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_APP_URL,
  plugins: [adminClient()],
});

export const { signIn, signUp, signOut, useSession, requestPasswordReset, resetPassword } =
  authClient;
