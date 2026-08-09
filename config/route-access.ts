import type { TohRole } from "@/types/auth";

export type RouteAccessRule = {
  family: string;
  examples: string;
  visibility: "public" | "guest-only" | "protected";
  roles: "any signed-in user" | TohRole[];
  recentMfa: "not required" | "backend-enforced" | "required";
  deniedRedirect: string;
  cachePolicy: "public revalidate" | "private no-store";
  indexing: "index" | "noindex";
  backendEndpoint: string;
};

export const routeAccessRules: RouteAccessRule[] = [
  {
    family: "(public)",
    examples: "/, /about, /braiders, /beauty, /marketplace, /legal/privacy",
    visibility: "public",
    roles: "any signed-in user",
    recentMfa: "not required",
    deniedRedirect: "n/a",
    cachePolicy: "public revalidate",
    indexing: "index",
    backendEndpoint:
      "/api/v1/braiders/nearby, /api/v1/services, /api/v1/customer/policies",
  },
  {
    family: "(auth)",
    examples: "/sign-in, /sign-up, /forgot-password, /reset-password, /mfa",
    visibility: "guest-only",
    roles: "any signed-in user",
    recentMfa: "not required",
    deniedRedirect: "/account",
    cachePolicy: "private no-store",
    indexing: "noindex",
    backendEndpoint: "/api/v1/auth/*",
  },
  {
    family: "(booking)",
    examples: "/book, /book/[braiderId]/payment, /book/confirmation",
    visibility: "protected",
    roles: ["CUSTOMER", "BRAIDER", "ADMIN"],
    recentMfa: "not required",
    deniedRedirect: "/sign-in",
    cachePolicy: "private no-store",
    indexing: "noindex",
    backendEndpoint:
      "/api/v1/availability/*, /api/v1/bookings, /api/v1/payments/*",
  },
  {
    family: "(account)",
    examples:
      "/account, /bookings, /support, /professional-application, /account/settings/security",
    visibility: "protected",
    roles: ["CUSTOMER", "BRAIDER", "ADMIN"],
    recentMfa: "backend-enforced",
    deniedRedirect: "/sign-in",
    cachePolicy: "private no-store",
    indexing: "noindex",
    backendEndpoint: "/api/v1/customer/*, /api/v1/auth/account/*",
  },
  {
    family: "(braider)",
    examples: "/studio, /studio/calendar, /studio/services",
    visibility: "protected",
    roles: ["BRAIDER"],
    recentMfa: "backend-enforced",
    deniedRedirect: "/account",
    cachePolicy: "private no-store",
    indexing: "noindex",
    backendEndpoint: "/api/v1/braiders/*, /api/v1/availability/*",
  },
  {
    family: "(admin)",
    examples: "/admin, /admin/applications, /admin/payments",
    visibility: "protected",
    roles: ["ADMIN"],
    recentMfa: "required",
    deniedRedirect: "/account",
    cachePolicy: "private no-store",
    indexing: "noindex",
    backendEndpoint: "/api/v1/admin/*, domain-specific approval/refund endpoints",
  },
];

export const protectedRoutePrefixes = [
  "/account",
  "/book",
  "/bookings",
  "/checkout",
  "/studio",
  "/admin",
  "/support",
  "/professional-application",
] as const;

export const guestOnlyRoutePrefixes = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/auth-error",
] as const;
