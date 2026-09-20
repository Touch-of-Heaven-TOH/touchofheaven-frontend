"use client";

import { CircleCheck, CircleX, Database, Gauge, HardDriveDownload } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminPanel } from "@/features/admin/components/AdminPrimitives";
import { browserApiFetch } from "@/lib/api/browser";

/**
 * Whether the platform is answering, and how fast.
 *
 * The check is a real request to the health endpoint, timed in the
 * browser. That measurement includes the network between this machine and
 * the API, so it is a "can I reach it, and does it feel slow" reading
 * rather than server-side latency - which is what an admin actually wants
 * to know when something is reported as broken.
 */

type HealthState =
  | { status: "checking" }
  | { status: "up"; responseMs: number; database: boolean }
  | { status: "down"; reason: string };

/** The shape of /health/ready, which runs a real `SELECT 1`. */
type HealthResponse = {
  status?: string;
  checks?: { database?: string };
  timestamp?: string;
};

function databaseIsUp(payload: HealthResponse): boolean {
  // The endpoint answers 503 when the query fails, so reaching here at all
  // is most of the answer; the check field confirms it explicitly.
  return payload.checks?.database === "ok" || payload.status === "ready";
}

export function SystemHealth() {
  const [health, setHealth] = useState<HealthState>({ status: "checking" });

  useEffect(() => {
    let cancelled = false;

    /**
     * One slow or cold answer is not an outage. A single failed request
     * used to leave this tile claiming the API was unreachable until
     * somebody reloaded the page - which is exactly how an indicator
     * teaches people to ignore it. Try three times, spaced out, before
     * saying anything is down.
     */
    async function check() {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const startedAt = performance.now();
        try {
          const payload = await browserApiFetch<HealthResponse>("/api/v1/health/ready");
          if (cancelled) return;
          setHealth({
            status: "up",
            responseMs: Math.round(performance.now() - startedAt),
            database: databaseIsUp(payload),
          });
          return;
        } catch {
          if (cancelled) return;
          if (attempt === 2) {
            setHealth({ status: "down", reason: "No answer after three tries." });
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
        }
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  const up = health.status === "up";
  const databaseUp = health.status === "up" && health.database;

  return (
    <AdminPanel title="System health">
      <ul role="list" className="grid gap-3 sm:grid-cols-3">
        <HealthTile
          icon={Database}
          label="Database"
          value={
            health.status === "checking"
              ? "Checking…"
              : databaseUp
                ? "Connected"
                : "Not reachable"
          }
          ok={health.status === "checking" ? null : databaseUp}
        />
        <HealthTile
          icon={Gauge}
          label="API response"
          value={
            health.status === "checking"
              ? "Checking…"
              : up
                ? `${health.responseMs} ms`
                : health.reason
          }
          ok={health.status === "checking" ? null : up}
        />
        <HealthTile
          icon={HardDriveDownload}
          label="Last backup"
          value="Not tracked"
          ok={null}
          // TODO: no backup schedule is recorded anywhere yet. Once backups
          // run, expose their last-completed timestamp and read it here
          // rather than showing a number nobody has verified.
          note="Backups aren't recorded yet, so there is nothing to show."
        />
      </ul>
    </AdminPanel>
  );
}

function HealthTile({
  icon: Icon,
  label,
  value,
  ok,
  note,
}: {
  icon: typeof Database;
  label: string;
  value: string;
  /** null while unknown or not applicable - shows neutral, not a false green. */
  ok: boolean | null;
  note?: string;
}) {
  return (
    <li className="rounded-md border border-[var(--color-border)] p-4">
      <div className="flex items-start gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full ${
            ok === null
              ? "bg-[var(--color-surface-strong)] text-[var(--color-text-muted)]"
              : ok
                ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
          }`}
        >
          <Icon aria-hidden="true" size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--color-text-primary)]">{label}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm">
            {/* An icon beside the word, so the state doesn't rest on colour. */}
            {ok === true ? (
              <CircleCheck aria-hidden="true" size={14} className="text-[var(--color-success)]" />
            ) : ok === false ? (
              <CircleX aria-hidden="true" size={14} className="text-[var(--color-danger)]" />
            ) : null}
            {value}
          </p>
          {note ? <p className="mt-1 text-xs text-[var(--color-text-muted)]">{note}</p> : null}
        </div>
      </div>
    </li>
  );
}
