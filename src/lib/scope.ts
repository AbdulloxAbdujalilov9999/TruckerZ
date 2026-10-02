import { auth } from "@/lib/auth";

/**
 * Every server action re-checks auth independently of the proxy/middleware
 * guard on pages — server actions are callable directly and must not trust
 * that a request came through a protected page.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated.");
  }
  return session.user;
}

export async function requireOwner() {
  const user = await requireUser();
  if (user.role !== "OWNER") {
    throw new Error("Only an account owner can do this.");
  }
  return user;
}
