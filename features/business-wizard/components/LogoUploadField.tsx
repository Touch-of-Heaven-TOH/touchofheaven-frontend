"use client";

import { useRef, useState } from "react";
import { ApiClientError } from "@/lib/api/errors";
import { browserApiFetch } from "@/lib/api/browser";

const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_BYTES = 5 * 1024 * 1024;

export function LogoUploadField({
  logoUrl,
  businessInitial,
  onUploaded,
}: {
  logoUrl: string | null;
  businessInitial: string;
  onUploaded: (publicUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setStatus("error");
      setError("Use a JPG or PNG image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus("error");
      setError("Image must be 5 MB or smaller.");
      return;
    }

    setStatus("uploading");
    setError(null);
    try {
      const { uploadUrl, publicUrl } = await browserApiFetch<{
        uploadUrl: string;
        key: string;
        publicUrl: string;
      }>("/api/v1/professional-applications/wizard/logo/upload-url", {
        method: "POST",
        body: { contentType: file.type },
      });

      const putResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putResponse.ok) throw new Error("Upload failed");

      onUploaded(publicUrl);
      setStatus("idle");
    } catch (caught) {
      setStatus("error");
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "We could not upload that image. Try again.",
      );
    }
  }

  return (
    <div className="flex items-center gap-4">
      <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--color-brand-soft)] text-xl font-bold text-[var(--color-brand-strong)]">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote R2 URL, not worth next/image config for a small wizard avatar
          <img alt="" className="size-full object-cover" src={logoUrl} />
        ) : (
          businessInitial
        )}
      </span>
      <div>
        <button
          className="btn-secondary"
          disabled={status === "uploading"}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {status === "uploading" ? "Uploading..." : "Upload logo"}
        </button>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">JPG or PNG, up to 5 MB</p>
        {error ? <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p> : null}
        <input
          accept="image/jpeg,image/png"
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
