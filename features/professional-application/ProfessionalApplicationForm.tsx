"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { ApiClientError } from "@/lib/api/errors";
import {
  fetchMyProfessionalApplications,
  submitProfessionalApplication,
  type ProfessionalApplication,
  type RequestableRole,
} from "@/features/professional-application/api";

const MESSAGE_MAX_CHARS = 2000;

const ROLE_OPTIONS: { value: RequestableRole; label: string; description: string }[] = [
  {
    value: "BRAIDER",
    label: "Braider / Barber",
    description: "Offer hair braiding, barbering, or styling services and take bookings.",
  },
  {
    value: "SELLER",
    label: "Seller",
    description: "List and sell products in the Touch of Heaven marketplace.",
  },
];

function openApplication(applications: ProfessionalApplication[]) {
  return applications.find(
    (application) => application.status === "PENDING" || application.status === "UNDER_REVIEW",
  );
}

function latestDecided(applications: ProfessionalApplication[]) {
  return applications.find(
    (application) => application.status === "APPROVED" || application.status === "REJECTED",
  );
}

export function ProfessionalApplicationForm() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ProfessionalApplication[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<RequestableRole[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let live = true;
    fetchMyProfessionalApplications()
      .then((result) => {
        if (live) setApplications(result);
      })
      .catch(() => {
        if (live) setLoadError("We could not load your application status. Try again shortly.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  function toggleRole(role: RequestableRole) {
    setSelectedRoles((current) =>
      current.includes(role) ? current.filter((value) => value !== role) : [...current, role],
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    if (selectedRoles.length === 0) {
      setSubmitError("Select at least one role to apply for.");
      return;
    }
    if (message.trim().length === 0) {
      setSubmitError("Tell us a bit about your experience or business.");
      return;
    }

    setSubmitting(true);
    try {
      await submitProfessionalApplication({
        requestedRoles: selectedRoles,
        applicantMessage: message.trim(),
      });
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof ApiClientError
          ? error.message
          : "We could not submit your application. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-text-muted)]">Loading your application status...</p>;
  }

  if (loadError) {
    return <p className="text-sm text-[var(--color-danger)]">{loadError}</p>;
  }

  const pending = openApplication(applications);
  if (pending && !submitted) {
    return (
      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <p className="text-sm font-bold text-[var(--color-text-primary)]">
          Your application is {pending.status === "PENDING" ? "pending review" : "under review"}.
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Requested: {pending.requestedRoles.join(", ")}. Submitted{" "}
          {new Date(pending.submittedAt).toLocaleDateString()}. We will email you once a decision
          is made.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <p className="text-sm font-bold text-[var(--color-text-primary)]">
          Application submitted.
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          We will review your request and email you once a decision is made.
        </p>
        <Link className="btn-secondary mt-4 inline-flex" href="/account">
          Back to your account
        </Link>
      </div>
    );
  }

  const decided = latestDecided(applications);

  return (
    <div className="grid gap-6">
      {decided?.status === "REJECTED" ? (
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
          <p className="font-bold text-[var(--color-text-primary)]">
            Your previous application was not approved.
          </p>
          {decided.reviewNotes ? (
            <p className="mt-1 text-[var(--color-text-muted)]">{decided.reviewNotes}</p>
          ) : null}
          <p className="mt-1 text-[var(--color-text-muted)]">
            You can submit a new application below.
          </p>
        </div>
      ) : null}

      <form className="grid gap-6" onSubmit={handleSubmit}>
        <fieldset className="grid gap-3">
          <legend className="text-sm font-bold text-[var(--color-text-primary)]">
            What would you like to do on Touch of Heaven?
          </legend>
          {ROLE_OPTIONS.map((option) => (
            <label
              className="flex cursor-pointer items-start gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-brand)]"
              key={option.value}
            >
              <input
                checked={selectedRoles.includes(option.value)}
                className="mt-1"
                onChange={() => toggleRole(option.value)}
                type="checkbox"
              />
              <span>
                <span className="block text-sm font-bold text-[var(--color-text-primary)]">
                  {option.label}
                </span>
                <span className="block text-sm text-[var(--color-text-muted)]">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-text-primary)]" htmlFor="applicantMessage">
            Tell us about your experience or business
            <span className="text-[var(--color-danger)]"> *</span>
          </label>
          <textarea
            className="min-h-32 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus-ring"
            id="applicantMessage"
            maxLength={MESSAGE_MAX_CHARS}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Years of experience, specialties, portfolio links, or what you plan to sell..."
            value={message}
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            {message.length}/{MESSAGE_MAX_CHARS}
          </p>
        </div>

        {submitError ? (
          <p className="text-sm text-[var(--color-danger)]" role="alert">
            {submitError}
          </p>
        ) : null}

        <Button loading={submitting} type="submit">
          Submit application
        </Button>
      </form>
    </div>
  );
}
