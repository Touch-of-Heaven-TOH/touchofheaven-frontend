"use client";

import { ArrowLeft, CircleCheck, CircleX, MapPin, TriangleAlert } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import { AdminPageHeader, AdminPanel } from "@/features/admin/components/AdminPrimitives";
import { ApplicationStatusBadge } from "@/features/admin/applications/ApplicationStatusBadge";
import {
  adminFetcher,
  adminRequest,
  errorMessage,
  isApplicationListKey,
} from "@/features/admin/lib/api";
import type { ApplicationDetail } from "@/features/admin/lib/admin-types";

/**
 * One application, and the decision that ends it.
 *
 * Both decisions are irreversible - the backend refuses a second one with
 * a 409 - so both go through a confirmation step that says what will
 * happen, and rejection additionally requires a reason, because the
 * applicant is sent that reason verbatim.
 */

// MapLibre touches `window` on import, so it must not run during SSR.
const ApplicationLocationMap = dynamic(
  () =>
    import("@/features/admin/applications/ApplicationLocationMap").then(
      (module) => module.ApplicationLocationMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-md bg-[var(--color-surface-strong)]" />
    ),
  },
);

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function humanise(value: string | null): string {
  if (!value) return "—";
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ApplicationReview({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const path = `/api/v1/admin/professional-applications/${applicationId}`;
  // The endpoint answers { application: ... }, not the application itself.
  const { data, error, isLoading, mutate } = useSWR<{ application: ApplicationDetail }>(
    path,
    adminFetcher,
  );
  const application = data?.application;
  const { mutate: mutateList } = useSWRConfig();

  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function submitDecision() {
    if (!decision) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await adminRequest(
        `${path}/${decision}`,
        "POST",
        decision === "reject" ? { reviewNotes: reason.trim() } : {},
      );
      setDecision(null);
      setReason("");
      setResult(
        decision === "approve"
          ? "Approved. Their Studio is open and we've emailed them."
          : "Rejected. We've emailed them your reason.",
      );
      await mutate();
      // The queue is a separate request; without this it keeps showing
      // this application as still waiting to be decided.
      await mutateList(isApplicationListKey);
      router.refresh();
    } catch (submitError) {
      setActionError(errorMessage(submitError, "We couldn't save that decision."));
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-3" aria-busy="true" aria-label="Loading the application">
        <div className="h-24 animate-pulse rounded-md bg-[var(--color-surface-strong)]" />
        <div className="h-64 animate-pulse rounded-md bg-[var(--color-surface-strong)]" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="grid justify-items-start gap-3 rounded-md border border-[var(--color-border)] bg-white p-6">
        <p className="flex items-center gap-2 font-bold text-[var(--color-danger)]">
          <TriangleAlert aria-hidden="true" size={18} />
          {errorMessage(error, "We couldn't load this application.")}
        </p>
        <div className="flex gap-2">
          <Button onClick={() => void mutate()}>Try again</Button>
          <Button variant="secondary" onClick={() => router.push("/admin/applications")}>
            Back to the queue
          </Button>
        </div>
      </div>
    );
  }

  const decided = application.status === "APPROVED" || application.status === "REJECTED";
  const hasPin = application.latitude !== null && application.longitude !== null;

  return (
    <div>
      <Link
        href="/admin/applications"
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--color-brand)] hover:underline"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        All applications
      </Link>

      <AdminPageHeader
        eyebrow="Application"
        title={application.businessName ?? application.applicantName}
        description={`Submitted ${formatDateTime(application.submittedAt)} by ${application.applicantName}.`}
        actions={<ApplicationStatusBadge status={application.status} />}
      />

      {result ? (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 rounded-md bg-[var(--color-success-soft)] px-4 py-3 text-sm font-bold text-[var(--color-success)]"
        >
          <CircleCheck aria-hidden="true" size={18} />
          {result}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="grid gap-4">
          <AdminPanel title="Applicant">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={application.applicantName} />
              <Field label="Email" value={application.applicantEmail} />
              <Field label="Name clients will see" value={application.professionalName} />
              <Field label="Phone" value={application.businessPhone} />
              <Field label="Roles requested" value={application.requestedRoles.map(humanise).join(", ")} />
              <Field label="Handle" value={application.handle ? `@${application.handle}` : null} />
            </dl>
            {application.applicantMessage ? (
              <div className="mt-4 rounded-md bg-[var(--color-surface-strong)] p-3">
                <p className="text-xs font-bold uppercase text-[var(--color-text-muted)]">
                  Their message
                </p>
                <p className="mt-1 text-sm">{application.applicantMessage}</p>
              </div>
            ) : null}
          </AdminPanel>

          <AdminPanel title="Business">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Business name" value={application.businessName} />
              <Field label="Category" value={humanise(application.businessCategory)} />
              <Field label="How they work" value={humanise(application.workMode)} />
              <Field
                label="Where they work"
                value={application.locationType.map(humanise).join(", ") || null}
              />
              <Field label="Time zone" value={application.timezone} />
              <Field
                label="Working days"
                value={
                  application.workingDays.length
                    ? application.workingDays.map((day) => DAY_NAMES[day]?.slice(0, 3)).join(", ")
                    : null
                }
              />
            </dl>
            {application.businessDescription ? (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase text-[var(--color-text-muted)]">
                  Description
                </p>
                <p className="mt-1 text-sm">{application.businessDescription}</p>
              </div>
            ) : null}
          </AdminPanel>

          <AdminPanel title="Location">
            <p className="flex items-start gap-2 text-sm">
              <MapPin aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-[var(--color-brand)]" />
              <span>
                {application.addressLine ?? "No address given."}
                {application.hideAddressUntilConfirmed ? (
                  <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
                    Clients will see an approximate area until a booking is confirmed. You are
                    seeing the exact address because you are reviewing it.
                  </span>
                ) : null}
              </span>
            </p>
            <div className="mt-3">
              {hasPin ? (
                <ApplicationLocationMap
                  latitude={application.latitude as number}
                  longitude={application.longitude as number}
                  label={application.businessName ?? application.applicantName}
                />
              ) : (
                <p className="rounded-md border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
                  No map pin: this application was filed through the older form, which never
                  collected coordinates.
                </p>
              )}
            </div>
          </AdminPanel>

          {application.draftServices?.length ? (
            <AdminPanel title={`Services they plan to offer (${application.draftServices.length})`}>
              <ul role="list" className="grid gap-2">
                {application.draftServices.map((service) => (
                  <li
                    key={service.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-[var(--color-border)] p-3"
                  >
                    <span className="font-bold">{service.name}</span>
                    <span className="text-sm text-[var(--color-text-muted)]">
                      {service.durationMinutes ? `${service.durationMinutes} min` : null}
                      {service.durationMinutes && service.priceCents ? " · " : null}
                      {service.priceCents ? `${(service.priceCents / 100).toFixed(2)}` : null}
                    </span>
                  </li>
                ))}
              </ul>
            </AdminPanel>
          ) : null}
        </div>

        <div className="grid gap-4 xl:sticky xl:top-6">
          <AdminPanel title="Decision">
            {decided ? (
              <div className="grid gap-2">
                <p className="text-sm">
                  {application.status === "APPROVED" ? "Approved" : "Rejected"} on{" "}
                  {formatDateTime(application.reviewedAt)}.
                </p>
                {application.reviewNotes ? (
                  <p className="rounded-md bg-[var(--color-surface-strong)] p-3 text-sm">
                    {application.reviewNotes}
                  </p>
                ) : null}
                <p className="text-xs text-[var(--color-text-muted)]">
                  A decision can&apos;t be taken back here. Changing it means acting on the
                  account itself.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                <p className="text-sm text-[var(--color-text-muted)]">
                  Approving grants their role, opens their Studio and publishes their profile.
                  Either way they get an email.
                </p>
                {actionError ? (
                  <p
                    role="alert"
                    className="rounded-md bg-[var(--color-danger-soft)] px-3 py-2 text-sm font-bold text-[var(--color-danger)]"
                  >
                    {actionError}
                  </p>
                ) : null}
                <Button
                  onClick={() => {
                    setActionError(null);
                    setDecision("approve");
                  }}
                  leadingIcon={<CircleCheck aria-hidden="true" size={16} />}
                >
                  Approve
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setActionError(null);
                    setDecision("reject");
                  }}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--color-danger)] px-4 text-sm font-bold text-[var(--color-danger)] transition hover:bg-[var(--color-danger-soft)]"
                >
                  <CircleX aria-hidden="true" size={16} />
                  Reject
                </button>
              </div>
            )}
          </AdminPanel>
        </div>
      </div>

      <Modal
        open={decision !== null}
        onClose={() => (submitting ? undefined : setDecision(null))}
        title={decision === "approve" ? "Approve this application?" : "Reject this application?"}
      >
        <div className="grid gap-4">
          {decision === "approve" ? (
            <p className="text-sm">
              {application.applicantName} will be given the{" "}
              {application.requestedRoles.map(humanise).join(" and ")} role, their Studio will open and
              their profile will go live. We&apos;ll email them. This can&apos;t be undone here.
            </p>
          ) : (
            <>
              <p className="text-sm">
                {application.applicantName} will be told their application wasn&apos;t approved, and
                will be sent the reason below word for word.
              </p>
              <div className="grid gap-1.5">
                <label htmlFor="rejection-reason" className="text-sm font-bold">
                  Why are you rejecting it? <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="rejection-reason"
                  required
                  rows={4}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="w-full rounded-md border border-[var(--color-border)] p-3 text-sm outline-none focus:border-[var(--color-brand)]"
                  placeholder="What would they need to change to be approved?"
                />
                <p className="text-xs text-[var(--color-text-muted)]">
                  They read this. Write it to them, not about them.
                </p>
              </div>
            </>
          )}

          {actionError ? (
            <p
              role="alert"
              className="rounded-md bg-[var(--color-danger-soft)] px-3 py-2 text-sm font-bold text-[var(--color-danger)]"
            >
              {actionError}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setDecision(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={() => void submitDecision()}
              loading={submitting}
              disabled={decision === "reject" && reason.trim().length === 0}
            >
              {decision === "approve" ? "Yes, approve" : "Yes, reject"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-[var(--color-text-muted)]">{label}</dt>
      <dd className="mt-0.5 text-sm [overflow-wrap:anywhere]">{value ?? "—"}</dd>
    </div>
  );
}
