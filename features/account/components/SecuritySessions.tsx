"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { browserApiFetch } from "@/lib/api/browser";
import { ApiClientError } from "@/lib/api/errors";

type Session = {
  id: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

type SessionsResponse = { sessions: Session[] };

function fetchSessions(path: string): Promise<SessionsResponse> {
  return browserApiFetch<SessionsResponse>(path);
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SecuritySessions() {
  const { data, error, isLoading, mutate } = useSWR<SessionsResponse>(
    "/api/v1/auth/sessions",
    fetchSessions,
  );
  const sessions = data?.sessions ?? [];

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const otherSessionCount = sessions.filter((s) => !s.isCurrent).length;

  async function handleRevoke(id: string) {
    setRevokingId(id);
    setActionError(null);
    try {
      await browserApiFetch(`/api/v1/auth/sessions/${id}`, { method: "DELETE" });
      await mutate();
    } catch (err) {
      setActionError(
        err instanceof ApiClientError ? err.message : "We couldn't revoke that session.",
      );
    } finally {
      setRevokingId(null);
    }
  }

  async function handleSignOutAll() {
    setSigningOutAll(true);
    setActionError(null);
    try {
      await browserApiFetch("/api/v1/auth/logout-all", { method: "POST" });
      await mutate();
    } catch (err) {
      setActionError(
        err instanceof ApiClientError ? err.message : "We couldn't sign out other sessions.",
      );
    } finally {
      setSigningOutAll(false);
    }
  }

  if (isLoading) return <LoadingSkeleton label="Loading sessions" lines={4} />;
  if (error) {
    return <ErrorState description="We couldn't load your sessions." onRetry={() => void mutate()} />;
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--color-brand)]">Account</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
            Active sessions
          </h1>
        </div>
        {otherSessionCount > 0 ? (
          <Button variant="danger" loading={signingOutAll} onClick={() => void handleSignOutAll()}>
            Sign out all other sessions
          </Button>
        ) : null}
      </div>

      {actionError ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {actionError}
        </p>
      ) : null}

      {sessions.length === 0 ? (
        <EmptyState title="No active sessions" description="You aren't signed in anywhere right now." />
      ) : (
        <ul role="list" className="grid gap-3">
          {sessions.map((session) => (
            <li key={session.id} className="surface-panel flex items-center justify-between gap-4 p-4">
              <div>
                <p className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
                  {session.isCurrent ? "This device" : "Session"}
                  {session.isCurrent ? (
                    <span className="rounded-full bg-[var(--color-brand-soft)] px-2 py-0.5 text-xs font-bold text-[var(--color-brand)]">
                      Current
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Signed in {formatDateTime(session.createdAt)} · Last active{" "}
                  {formatDateTime(session.lastUsedAt)}
                </p>
              </div>
              {!session.isCurrent ? (
                <Button
                  variant="secondary"
                  loading={revokingId === session.id}
                  onClick={() => void handleRevoke(session.id)}
                >
                  Revoke
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-[var(--color-text-muted)]">
        Device and location details aren&apos;t shown - this platform only stores irreversibly
        hashed connection data, never raw device or location information.
      </p>
    </section>
  );
}
