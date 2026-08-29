"use client";

import { FileCheck2, IdCard } from "lucide-react";
import { useRef, useState } from "react";
import { ApiClientError } from "@/lib/api/errors";
import { browserApiFetch } from "@/lib/api/browser";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export function DocumentUploadCard({
  documentType,
  label,
  uploaded,
  onUploaded,
}: {
  documentType: "GOVERNMENT_ID" | "PROFESSIONAL_LICENSE";
  label: string;
  uploaded: boolean;
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setStatus("error");
      setError("Use a JPG, PNG, or PDF file.");
      return;
    }

    setStatus("uploading");
    setError(null);
    try {
      const { uploadUrl, key } = await browserApiFetch<{ uploadUrl: string; key: string }>(
        "/api/v1/professional-applications/wizard/documents/upload-url",
        { method: "POST", body: { documentType, contentType: file.type } },
      );

      const putResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putResponse.ok) throw new Error("Upload failed");

      await browserApiFetch("/api/v1/professional-applications/wizard/documents/confirm", {
        method: "POST",
        body: { documentType, key },
      });

      onUploaded();
      setStatus("idle");
    } catch (caught) {
      setStatus("error");
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "We could not upload that document. Try again.",
      );
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="flex items-center gap-3">
        <IdCard aria-hidden="true" className="text-[var(--color-copper)]" size={22} />
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</span>
      </span>
      <div className="text-right">
        <button
          className="btn-secondary inline-flex items-center gap-2"
          disabled={status === "uploading"}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {uploaded ? (
            <>
              <FileCheck2 aria-hidden="true" size={16} />
              Replace document
            </>
          ) : status === "uploading" ? (
            "Uploading..."
          ) : (
            "Upload document"
          )}
        </button>
        {error ? <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p> : null}
        <input
          accept="image/jpeg,image/png,application/pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.target.value = "";
          }}
          ref={inputRef}
          type="file"
        />
      </div>
    </div>
  );
}
