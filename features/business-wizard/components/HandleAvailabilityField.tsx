"use client";

import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ApiClientError } from "@/lib/api/errors";
import { browserApiFetch } from "@/lib/api/browser";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type Availability = { available: boolean; reason?: "taken" | "requested" } | null;

export function HandleAvailabilityField({
  value,
  currentHandle,
  onChange,
}: {
  value: string;
  currentHandle: string | null;
  onChange: (value: string) => void;
}) {
  const debounced = useDebouncedValue(value, 500);
  const [availability, setAvailability] = useState<Availability>(null);
  const [checking, setChecking] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const candidate = debounced.trim().toLowerCase();
    if (!candidate || candidate.length < 3 || candidate === currentHandle) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing a stale availability result when the debounced input becomes invalid/unchanged is the point of this effect
      setAvailability(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    setChecking(true);
    browserApiFetch<Availability>(
      `/api/v1/professional-applications/wizard/handle-availability?handle=${encodeURIComponent(candidate)}`,
    )
      .then((result) => {
        if (requestIdRef.current === requestId) setAvailability(result);
      })
      .catch((caught) => {
        if (requestIdRef.current !== requestId) return;
        setAvailability(
          caught instanceof ApiClientError
            ? { available: false }
            : { available: false },
        );
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setChecking(false);
      });
  }, [debounced, currentHandle]);

  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
      Profile handle
      <div className="flex items-center rounded-md border border-[var(--color-border)] bg-white focus-within:border-[var(--color-brand)]">
        <span className="pl-3 text-sm text-[var(--color-text-muted)]">
          touchofheaven.com/pro/
        </span>
        <input
          className="min-h-12 flex-1 rounded-md bg-white px-2 text-base outline-none"
          onChange={(event) =>
            onChange(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
          }
          value={value}
        />
        {checking ? (
          <span className="pr-3 text-xs text-[var(--color-text-muted)]">Checking...</span>
        ) : availability?.available ? (
          <Check aria-hidden="true" className="mr-3 text-[var(--color-success)]" size={18} />
        ) : availability && !availability.available ? (
          <X aria-hidden="true" className="mr-3 text-[var(--color-danger)]" size={18} />
        ) : null}
      </div>
      {availability && !availability.available ? (
        <span className="text-xs text-[var(--color-danger)]">
          {availability.reason === "taken"
            ? "That handle is already in use."
            : "That handle has already been requested by another application."}
        </span>
      ) : null}
    </label>
  );
}
