import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StudioShell } from "@/features/studio/components/shell/StudioShell";
import type { BusinessContext } from "@/features/studio/lib/types";
import { ApiClientError } from "@/lib/api/errors";
import { serverApiFetch } from "@/lib/api/server";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Studio",
    template: "%s · Studio | Touch of Heaven",
  },
  robots: { index: false, follow: false },
};

/**
 * Access to the Studio is decided by the backend's business context, not
 * by the BRAIDER role alone: an owner qualifies through their business
 * profile, and an invited stylist or receptionist through their accepted
 * team membership. Anyone signed in without either lands on the
 * invitations page, which also explains how to set up a business.
 */
export default async function StudioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireUser();

  const result = await serverApiFetch<BusinessContext>("/api/v1/business/context").then(
    (context) => ({ ok: true as const, context }),
    (error: unknown) => ({ ok: false as const, error }),
  );

  if (!result.ok) {
    if (result.error instanceof ApiClientError && result.error.status === 404) {
      redirect("/team-invitations");
    }
    if (result.error instanceof ApiClientError && result.error.status === 401) {
      redirect("/business/sign-in?callbackUrl=%2Fstudio");
    }
    throw result.error;
  }

  return <StudioShell context={result.context}>{children}</StudioShell>;
}
