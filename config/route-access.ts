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
    examples: "/, /about, /businesses, /beauty, /marketplace, /legal/privacy",
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
    examples:
      "/customer/sign-in, /customer/sign-up, /customer/forgot-password, /customer/reset-password, /mfa. " +
      "/business/sign-in and /business/sign-up are also public but NOT " +
      "guest-only (an already-signed-in customer must still be able to " +
      "reach /business/sign-up to apply as a business)",
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
    examples: "/book, /book/[businessId]/payment, /book/confirmation",
    visibility: "protected",
    roles: ["CUSTOMER", "BRAIDER", "ADMIN"],
    recentMfa: "not required",
    deniedRedirect: "/customer/sign-in",
    cachePolicy: "private no-store",
    indexing: "noindex",
    backendEndpoint:
      "/api/v1/availability/*, /api/v1/bookings, /api/v1/payments/*",
  },
  {
    family: "(account)",
    examples:
      "/account, /client-onboarding, /bookings, /messages, /support, /professional-application, /account/settings/security",
    visibility: "protected",
    roles: ["CUSTOMER", "BRAIDER", "ADMIN"],
    recentMfa: "backend-enforced",
    deniedRedirect: "/customer/sign-in",
    cachePolicy: "private no-store",
    indexing: "noindex",
    backendEndpoint:
      "/api/v1/customer/*, /api/v1/auth/account/*, /api/v1/messaging/*, /api/v1/resolution/*",
  },
  {
    family: "(business-studio)",
    examples: "/studio, /studio/calendar, /studio/services, /studio/messages",
    visibility: "protected",
    roles: ["BRAIDER"],
    recentMfa: "backend-enforced",
    deniedRedirect: "/account",
    cachePolicy: "private no-store",
    indexing: "noindex",
    backendEndpoint: "/api/v1/braiders/*, /api/v1/availability/*, /api/v1/messaging/*",
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
  "/ai-studio/my-looks",
  "/home",
  "/activity",
  "/profile",
  "/saved",
  "/notifications",
  "/client-onboarding",
  "/book",
  "/bookings",
  "/checkout",
  "/messages",
  "/disputes",
  "/studio",
  "/admin",
  "/support",
  "/professional-application",
  "/business/setup",
] as const;

// A signed-out visitor denied one of these specifically should land on
// /business/sign-in, not the generic /customer/sign-in - both are a subset
// of protectedRoutePrefixes above, checked first in proxy.ts.
export const businessProtectedRoutePrefixes = [
  "/studio",
  "/professional-application",
  "/business/setup",
] as const;

export const guestOnlyRoutePrefixes = [
  "/customer/sign-in",
  "/customer/sign-up",
  "/customer/forgot-password",
  "/customer/reset-password",
  "/verify-email",
  "/auth-error",
] as const;
