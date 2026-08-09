import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ApiClientError } from "@/lib/api/errors";
import { serverApiFetch } from "@/lib/api/server";
import { safeReturnUrl } from "@/lib/security/safe-return-url";
import type { SafeUser, TohRole } from "@/types/auth";

const sessionCookieNames = ["toh_session", "__Host-toh_session"] as const;

type AuthMeResponse = {
  user: SafeUser;
};

async function hasSessionCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return sessionCookieNames.some((name) => Boolean(cookieStore.get(name)?.value));
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  if (!(await hasSessionCookie())) return null;

  try {
    const data = await serverApiFetch<AuthMeResponse>("/api/v1/auth/me");
    return data.user;
  } catch (error) {
    if (error instanceof ApiClientError && error.status < 500) {
      return null;
    }

    throw error;
  }
}

async function currentPath(): Promise<string> {
  const headerStore = await headers();
  const pathname = headerStore.get("x-toh-pathname") ?? "/";
  const search = headerStore.get("x-toh-search") ?? "";
  return safeReturnUrl(`${pathname}${search}`);
}

export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (user) return user;

  const returnTo = encodeURIComponent(await currentPath());
  redirect(`/sign-in?callbackUrl=${returnTo}`);
}

export async function requireRole(
  role: TohRole,
  deniedRedirect = "/account",
): Promise<SafeUser> {
  const user = await requireUser();

  if (!user.roles.includes(role)) {
    redirect(deniedRedirect);
  }

  return user;
}
