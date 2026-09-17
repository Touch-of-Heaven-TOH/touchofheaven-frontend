"use client";

import { MailOpen, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { errorMessage, studioFetcher, studioRequest } from "@/features/studio/lib/api";
import { formatDate } from "@/features/studio/lib/format";
import type { TeamInvitation } from "@/features/studio/lib/types";

type InvitationsResponse = { invitations: TeamInvitation[] };

/**
 * Where someone lands when they open the Studio without belonging to a
 * business yet: accept a pending team invitation, or start their own
 * business setup.
 */
export function TeamInvitations() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<InvitationsResponse>(
    "/api/v1/business/team/invitations",
    studioFetcher,
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function respond(invitation: TeamInvitation, accept: boolean) {
    setPendingId(invitation.id);
    setActionError(null);
    try {
      await studioRequest(`/api/v1/business/team/invitations/${invitation.id}`, "POST", {
        accept,
      });
      if (accept) {
        router.push("/studio");
        router.refresh();
        return;
      }
      await mutate();
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setPendingId(null);
    }
  }

  const invitations = data?.invitations ?? [];

  return (
    <section className="mx-auto grid w-full max-w-2xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Business Studio access
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          The Studio is where businesses on Touch of Heaven run their appointments, clients and
          team.
        </p>
      </div>

      {isLoading ? (
        <div role="status" className="h-28 animate-pulse rounded-2xl bg-[var(--color-skeleton)]">
          <span className="sr-only">Loading invitations</span>
        </div>
      ) : error ? (
        <ErrorState description="We couldn't load your invitations." onRetry={() => void mutate()} />
      ) : invitations.length > 0 ? (
        <ul className="grid *:min-w-0 gap-3">
          {invitations.map((invitation) => (
            <li
              key={invitation.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-subtle)]"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                  <MailOpen aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--color-text-primary)]">
                    {invitation.businessName} invited you to join their team
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                    Role: {invitation.roleLabel}
                    {invitation.jobTitle ? ` · ${invitation.jobTitle}` : ""} · Sent{" "}
                    {formatDate(invitation.invitedAt, "UTC", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => void respond(invitation, false)}
                  disabled={pendingId !== null}
                  loading={pendingId === invitation.id}
                >
                  Decline
                </Button>
                <Button
                  onClick={() => void respond(invitation, true)}
                  disabled={pendingId !== null}
                  loading={pendingId === invitation.id}
                >
                  Accept and open Studio
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid *:min-w-0 justify-items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
            <Store aria-hidden="true" className="size-6" />
          </span>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            You are not part of a business yet
          </h2>
          <p className="max-w-md text-sm text-[var(--color-text-muted)]">
            Set up your own business, or ask the owner of the business you work with to invite this
            email address from their Team page.
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <Link href="/account" className="btn-secondary">
              Back to your account
            </Link>
            <Link href="/business/setup" className="btn-primary">
              Set up a business
            </Link>
          </div>
        </div>
      )}

      {actionError ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {actionError}
        </p>
      ) : null}
    </section>
  );
}
