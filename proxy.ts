import { NextResponse, type NextRequest } from "next/server";
import {
  guestOnlyRoutePrefixes,
  protectedRoutePrefixes,
} from "@/config/route-access";

const publicPrefixes = [
  "/",
  "/about",
  "/how-it-works",
  "/braiders",
  "/ai-studio",
  "/beauty",
  "/marketplace",
  "/map",
  "/contact",
  "/legal",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/auth-error",
  "/mfa",
  "/preview",
] as const;

const sessionCookieNames = ["toh_session", "__Host-toh_session"] as const;
const mfaPendingCookieNames = ["toh_mfa_pending", "__Host-toh_mfa_pending"] as const;

function startsWithRoute(pathname: string, prefixes: readonly string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function hasAnyCookie(request: NextRequest, names: readonly string[]) {
  return names.some((name) => Boolean(request.cookies.get(name)?.value));
}

function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

type SecurityHeaderOptions = {
  allowSameOriginFraming?: boolean;
};

function buildCsp(nonce: string, options: SecurityHeaderOptions = {}) {
  const isDev = process.env.NODE_ENV === "development";
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL
    ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
    : "http://localhost:3000";

  const directives = [
    "default-src 'self'",
    [
      "script-src 'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      isDev ? "'unsafe-eval'" : "",
      "https://js.stripe.com",
      "https://maps.googleapis.com",
      "https://maps.gstatic.com",
      "https://api.mapbox.com",
    ]
      .filter(Boolean)
      .join(" "),
    [
      "style-src 'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://api.mapbox.com",
      "https://maps.googleapis.com",
    ]
      .filter(Boolean)
      .join(" "),
    [
      "img-src 'self' data: blob:",
      "https://*.cloudflare.com",
      "https://*.supabase.co",
      "https://*.mapbox.com",
      "https://*.stripe.com",
      "https://maps.googleapis.com",
      "https://maps.gstatic.com",
      "https://*.googleusercontent.com",
      "https://*.ggpht.com",
    ].join(" "),
    "font-src 'self' https://fonts.gstatic.com",
    [
      "connect-src 'self'",
      apiOrigin,
      "https://api.stripe.com",
      "https://js.stripe.com",
      "https://api.mapbox.com",
      "https://events.mapbox.com",
      "https://*.supabase.co",
      "wss://*.supabase.co",
      "https://maps.googleapis.com",
    ].join(" "),
    [
      "frame-src",
      "'self'",
      "https://js.stripe.com",
      "https://hooks.stripe.com",
      "https://www.google.com",
    ].join(" "),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    options.allowSameOriginFraming ? "frame-ancestors 'self'" : "frame-ancestors 'none'",
  ];

  if (!isDev) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

function withSecurityHeaders(
  response: NextResponse,
  nonce: string,
  options: SecurityHeaderOptions = {},
) {
  response.headers.set("Content-Security-Policy", buildCsp(nonce, options));
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set(
    "X-Frame-Options",
    options.allowSameOriginFraming ? "SAMEORIGIN" : "DENY",
  );
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Explicitly disabled, not omitted: the legacy XSS auditor this header
  // controls is removed from modern browsers and the CSP above is what
  // actually defends against XSS. Leaving the header unset lets some
  // security scanners flag it as an oversight; setting it to 0 states the
  // decision.
  response.headers.set("X-XSS-Protection", "0");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=(self)",
  );
  response.headers.set("X-DNS-Prefetch-Control", "on");

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  return response;
}

function redirectTo(request: NextRequest, pathname: string, nonce: string) {
  return withSecurityHeaders(
    NextResponse.redirect(new URL(pathname, request.url)),
    nonce,
  );
}

export function proxy(request: NextRequest) {
  const nonce = createNonce();
  const { pathname, search } = request.nextUrl;
  const hasSession = hasAnyCookie(request, sessionCookieNames);
  const hasPendingMfa = hasAnyCookie(request, mfaPendingCookieNames);
  const securityHeaderOptions: SecurityHeaderOptions = {
    allowSameOriginFraming: startsWithRoute(pathname, ["/preview"]),
  };

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-toh-pathname", pathname);
  requestHeaders.set("x-toh-search", search);
  requestHeaders.set("Content-Security-Policy", buildCsp(nonce, securityHeaderOptions));

  if (startsWithRoute(pathname, guestOnlyRoutePrefixes) && hasSession) {
    return redirectTo(request, "/account", nonce);
  }

  if (pathname === "/mfa" && !hasPendingMfa && !hasSession) {
    return redirectTo(request, "/sign-in", nonce);
  }

  if (startsWithRoute(pathname, protectedRoutePrefixes) && !hasSession) {
    const callbackUrl = encodeURIComponent(`${pathname}${search}`);
    return redirectTo(request, `/sign-in?callbackUrl=${callbackUrl}`, nonce);
  }

  if (
    !startsWithRoute(pathname, publicPrefixes) &&
    !startsWithRoute(pathname, protectedRoutePrefixes)
  ) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    return withSecurityHeaders(response, nonce, securityHeaderOptions);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  return withSecurityHeaders(response, nonce, securityHeaderOptions);
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|icon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|txt|xml|json)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
