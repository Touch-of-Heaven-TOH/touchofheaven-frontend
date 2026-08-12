"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { browserApiFetch } from "@/lib/api/browser";
import { ApiClientError } from "@/lib/api/errors";
import {
  DISPUTE_CASE_TYPES,
  DISPUTE_CASE_TYPE_LABELS,
  type DisputeCaseType,
} from "@/lib/resolution/types";

const DESCRIPTION_MIN = 50;
const DESCRIPTION_MAX = 2000;

export function FileDisputeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId") ?? undefined;

  const [caseType, setCaseType] = useState<DisputeCaseType>("APPOINTMENT_QUALITY");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  const tooShort = description.trim().length > 0 && description.trim().length < DESCRIPTION_MIN;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (description.trim().length < DESCRIPTION_MIN) {
      setError(`Description must be at least ${DESCRIPTION_MIN} characters.`);
      return;
    }

    setStatus("submitting");
    setError(null);
    try {
      const result = await browserApiFetch<{ id: string; referenceNumber: string }>(
        "/api/v1/resolution/disputes",
        {
          method: "POST",
          body: {
            caseType,
            description: description.trim(),
            ...(appointmentId ? { appointmentId } : {}),
          },
        },
      );
      router.push(`/disputes/${result.id}`);
    } catch (err) {
      setStatus("idle");
      setError(
        err instanceof ApiClientError ? err.message : "We could not open this case. Try again.",
      );
    }
  }

  return (
    <section className="surface-panel mx-auto w-full max-w-xl p-6">
      <p className="text-xs font-semibold uppercase text-[var(--color-brand)]">
        Resolution center
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
        Open a dispute
      </h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Tell us what happened. A team member reviews every case.
      </p>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          What kind of issue is this?
          <select
            className="min-h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm focus-ring"
            value={caseType}
            onChange={(event) => setCaseType(event.target.value as DisputeCaseType)}
          >
            {DISPUTE_CASE_TYPES.map((type) => (
              <option key={type} value={type}>
                {DISPUTE_CASE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          Describe what happened
          <textarea
            className="min-h-32 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus-ring"
            value={description}
            maxLength={DESCRIPTION_MAX}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
          <span className="text-xs font-normal text-[var(--color-text-muted)]">
            {description.length}/{DESCRIPTION_MAX}
            {tooShort ? ` · at least ${DESCRIPTION_MIN} characters` : ""}
          </span>
        </label>

        {error ? (
          <p role="alert" className="text-sm text-[var(--color-danger)]">
            {error}
          </p>
        ) : null}

        <p className="text-xs text-[var(--color-text-muted)]">
          You can attach photos as evidence once the case is created.
        </p>

        <Button type="submit" loading={status === "submitting"}>
          Submit case
        </Button>
      </form>
    </section>
  );
}
