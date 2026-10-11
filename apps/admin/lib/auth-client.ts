import { createAuthClient } from "better-auth/react";

// No baseURL needed — the admin app's auth client always talks to its own
// same-origin API routes, so Better Auth's same-origin default is correct.
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
