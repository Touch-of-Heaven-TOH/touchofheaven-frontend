import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env/server";
import {
  PREVIEW_SWITCH_COOKIE,
  isPreviewAccessEnabled,
  isPreviewPersona,
  previewEmail,
  type PreviewPersona,
} from "@/lib/dev/preview-access";
import { safeReturnUrl } from "@/lib/security/safe-return-url";

export const dynamic = "force-dynamic";

const HOME: Record<PreviewPersona, string> = {
  owner: "/studio",
  customer: "/bookings",
  admin: "/admin",
};

function message(title: string, detail: string, status: number) {
  const escape = (value: string) =>
    value.replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]!);
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>${escape(title)}</title>` +
      `<body style="font-family:system-ui;max-width:640px;margin:48px auto;padding:0 16px;line-height:1.5">` +
      `<h1 style="font-size:22px">${escape(title)}</h1><p>${escape(detail)}</p>` +
      `<p><a href="/customer/sign-in">Sign in manually</a></p></body>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

/**
 * Development-only: signs the browser in as a demo account and continues to
 * the page that was asked for. See lib/dev/preview-access.ts.
 */
export async function GET(request: NextRequest) {
  if (!isPreviewAccessEnabled(request.headers.get("host"))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const persona = request.nextUrl.searchParams.get("as");
  if (!isPreviewPersona(persona)) {
    return message("Unknown preview account", "Use as=owner, as=customer or as=admin.", 400);
  }
  const next = safeReturnUrl(request.nextUrl.searchParams.get("next"), HOME[persona]);
  const email = previewEmail(persona);
  const password = process.env.DEV_PREVIEW_PASSWORD;
  if (!email || !password) {
    return message(
      "Preview access is not set up",
      `Add DEV_PREVIEW_${persona.toUpperCase()}_EMAIL and DEV_PREVIEW_PASSWORD to Frontend_for_HOF/.env.local.`,
      500,
    );
  }

  const api = getServerEnv().backendApiUrl.replace(/\/$/, "");
  const origin = request.nextUrl.origin;
  const setCookies: string[] = [];
  const cookieHeader = () => setCookies.map((cookie) => cookie.split(";")[0]).join("; ");

  try {
    // Already signed in as this demo account: go straight to the page, so
    // browsing does not use up the backend's sign-in limit.
    const incomingCookie = request.headers.get("cookie");
    if (incomingCookie) {
      const me = await fetch(`${api}/api/v1/auth/me`, {
        headers: { Origin: origin, Cookie: incomingCookie },
        cache: "no-store",
      });
      if (me.ok) {
        const current = ((await me.json()) as { data?: { user?: { email?: string } } }).data?.user?.email;
        if (current?.toLowerCase() === email.toLowerCase()) {
          return NextResponse.redirect(new URL(next, request.url));
        }
      }
    }

    const csrfResponse = await fetch(`${api}/api/v1/auth/csrf`, { headers: { Origin: origin }, cache: "no-store" });
    setCookies.push(...csrfResponse.headers.getSetCookie());
    const csrfToken = ((await csrfResponse.json()) as { data?: { csrfToken?: string } }).data?.csrfToken;
    if (!csrfToken) throw new Error("The backend did not return a CSRF token.");

    const login = await fetch(`${api}/api/v1/auth/login`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
        Cookie: cookieHeader(),
      },
      body: JSON.stringify({ email, password }),
    });
    const body = (await login.json().catch(() => ({}))) as {
      data?: { mfaRequired?: boolean };
      error?: { message?: string };
    };
    if (!login.ok) {
      return message(
        login.status === 429 ? "Too many sign-ins" : "Preview sign-in failed",
        login.status === 429
          ? "The backend limits sign-ins to 20 per 15 minutes from one computer. Wait a few minutes and reload."
          : `${email}: ${body.error?.message ?? `the backend answered ${login.status}`}`,
        login.status,
      );
    }
    if (body.data?.mfaRequired) {
      return message("Preview sign-in needs MFA", `${email} has two-step sign-in turned on.`, 409);
    }
    setCookies.push(...login.headers.getSetCookie());
  } catch (error) {
    return message(
      "The backend is not reachable",
      `Start the backend on ${api}. (${error instanceof Error ? error.message : String(error)})`,
      502,
    );
  }

  const response = NextResponse.redirect(new URL(next, request.url));
  for (const cookie of setCookies) response.headers.append("Set-Cookie", cookie);
  response.headers.append("Set-Cookie", `${PREVIEW_SWITCH_COOKIE}=${persona}; Path=/; Max-Age=20; HttpOnly; SameSite=Lax`);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
