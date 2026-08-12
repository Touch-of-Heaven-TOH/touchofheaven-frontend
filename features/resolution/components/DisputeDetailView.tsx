"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/shared/Button";
import { DisputeStatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { browserApiFetch } from "@/lib/api/browser";
import { ApiClientError } from "@/lib/api/errors";
import { useDispute } from "@/hooks/useDisputes";
import { DISPUTE_CASE_TYPE_LABELS } from "@/lib/resolution/types";

export type DisputeDetailViewProps = {
  disputeId: string;
  currentUserId: string;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fileExtension(file: File): string {
  const match = /\.([a-zA-Z0-9]{2,5})$/.exec(file.name);
  return (match?.[1] ?? "jpg").toLowerCase();
}

export function DisputeDetailView({ disputeId, currentUserId }: DisputeDetailViewProps) {
  const { dispute, isLoading, error, refresh } = useDispute(disputeId);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const { uploadUrl, key } = await browserApiFetch<{ uploadUrl: string; key: string }>(
        `/api/v1/resolution/disputes/${disputeId}/evidence/upload-url`,
        { method: "POST", body: { fileExtension: fileExtension(file) } },
      );

      // Direct browser-to-storage upload - this file's bytes never pass
      // through our own server. The confirm step below is what strips
      // EXIF and actually creates the DisputeEvidence record.
      const putResponse = await fetch(uploadUrl, { method: "PUT", body: file });
      if (!putResponse.ok) {
        throw new Error("The file could not be uploaded. Try again.");
      }

      await browserApiFetch(`/api/v1/resolution/disputes/${disputeId}/evidence`, {
        method: "POST",
        body: { key },
      });
      await refresh();
    } catch (err) {
      setUploadError(
        err instanceof ApiClientError ? err.message : "That file could not be attached.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleRespond() {
    if (!replyBody.trim() || replying) return;
    setReplying(true);
    setReplyError(null);
    try {
      await browserApiFetch(`/api/v1/resolution/disputes/${disputeId}/respond`, {
        method: "POST",
        body: { body: replyBody.trim() },
      });
      setReplyBody("");
      await refresh();
    } catch (err) {
      setReplyError(
        err instanceof ApiClientError ? err.message : "Your response could not be submitted.",
      );
    } finally {
      setReplying(false);
    }
  }

  if (isLoading && !dispute) {
    return <LoadingSkeleton label="Loading case" lines={5} />;
  }

  if (error && !dispute) {
    return <ErrorState description="We couldn't load this case." onRetry={() => void refresh()} />;
  }

  if (!dispute) return null;

  const canRespond =
    dispute.respondentUserId === currentUserId &&
    !dispute.respondentRepliedAt &&
    dispute.status !== "RESOLVED" &&
    dispute.status !== "DISMISSED";

  return (
    <section className="grid gap-6">
      <div className="surface-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--color-brand)]">
              {dispute.referenceNumber}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
              {DISPUTE_CASE_TYPE_LABELS[dispute.caseType]}
            </h1>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Opened {formatDateTime(dispute.createdAt)}
            </p>
          </div>
          <DisputeStatusBadge status={dispute.status} />
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-primary)]">
          {dispute.description}
        </p>
      </div>

      <div className="surface-panel p-6">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Evidence</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {dispute.evidence.length === 0
            ? "No files attached."
            : `${dispute.evidence.length} file${dispute.evidence.length === 1 ? "" : "s"} attached.`}
        </p>
        {uploadError ? (
          <p role="alert" className="mt-2 text-sm text-[var(--color-danger)]">
            {uploadError}
          </p>
        ) : null}
        {dispute.evidence.length < 5 ? (
          <div className="mt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => void handleFileSelected(event)}
            />
            <Button
              variant="secondary"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Add a photo
            </Button>
          </div>
        ) : null}
      </div>

      {dispute.respondentReplyBody ? (
        <div className="surface-panel p-6">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Response</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-primary)]">
            {dispute.respondentReplyBody}
          </p>
        </div>
      ) : canRespond ? (
        <div className="surface-panel p-6">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            This case names you - respond
          </h2>
          <textarea
            className="mt-3 min-h-28 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus-ring"
            value={replyBody}
            maxLength={2000}
            onChange={(event) => setReplyBody(event.target.value)}
          />
          {replyError ? (
            <p role="alert" className="mt-2 text-sm text-[var(--color-danger)]">
              {replyError}
            </p>
          ) : null}
          <Button
            className="mt-3"
            loading={replying}
            disabled={!replyBody.trim()}
            onClick={() => void handleRespond()}
          >
            Submit response
          </Button>
        </div>
      ) : null}

      {dispute.decisionReason ? (
        <div className="surface-panel p-6">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Decision</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-primary)]">
            {dispute.decisionReason}
          </p>
          {dispute.decisionRefundAmountMinor ? (
            <p className="mt-2 text-sm font-semibold text-[var(--color-success)]">
              Refund approved: $
              {(Number(dispute.decisionRefundAmountMinor) / 100).toFixed(2)}
            </p>
          ) : null}
          {dispute.decidedAt ? (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Decided {formatDateTime(dispute.decidedAt)}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
