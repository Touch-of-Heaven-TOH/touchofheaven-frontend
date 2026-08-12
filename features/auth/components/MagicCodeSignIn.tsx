"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { ApiClientError } from "@/lib/api/errors";
import { browserApiFetch } from "@/lib/api/browser";
import { safeReturnUrl } from "@/lib/security/safe-return-url";

const CODE_LENGTH = 6;

type Step = "request" | "verify";

type MagicCodeResponse = {
  message?: string;
  mfaRequired?: boolean;
};

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(local.length - 1, 3))}@${domain}`;
}

export function MagicCodeSignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [requestStatus, setRequestStatus] = useState<"idle" | "submitting" | "sent">("idle");
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  async function handleRequestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    setError(null);
    setRequestStatus("submitting");

    try {
      await browserApiFetch<MagicCodeResponse>("/api/v1/auth/magic-code/request", {
        method: "POST",
        body: { email: trimmedEmail },
      });
      setEmail(trimmedEmail);
      setRequestStatus("sent");
      setStep("verify");
      setDigits(Array(CODE_LENGTH).fill(""));
      requestAnimationFrame(() => inputRefs.current[0]?.focus());
    } catch (submitError) {
      setRequestStatus("idle");
      setError(
        submitError instanceof ApiClientError
          ? submitError.message
          : "We could not send that code. Try again.",
      );
    }
  }

  async function submitCode(code: string) {
    setVerifyStatus("submitting");
    setError(null);

    try {
      const data = await browserApiFetch<MagicCodeResponse>(
        "/api/v1/auth/magic-code/verify",
        { method: "POST", body: { email, code } },
      );

      if (data.mfaRequired) {
        const callbackUrl = safeReturnUrl(searchParams.get("callbackUrl"));
        router.push(`/mfa?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      router.push(safeReturnUrl(searchParams.get("callbackUrl")));
      router.refresh();
    } catch (submitError) {
      setVerifyStatus("idle");
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      setError(
        submitError instanceof ApiClientError
          ? submitError.message
          : "We could not verify that code. Try again.",
      );
    }
  }

  function handleDigitChange(index: number, rawValue: string) {
    const value = rawValue.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && next.every((digit) => digit !== "")) {
      void submitCode(next.join(""));
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (!pasted) return;
    event.preventDefault();
    const next = Array(CODE_LENGTH)
      .fill("")
      .map((_, index) => pasted[index] ?? "");
    setDigits(next);
    const lastFilled = Math.min(pasted.length, CODE_LENGTH) - 1;
    inputRefs.current[Math.max(lastFilled, 0)]?.focus();
    if (pasted.length >= CODE_LENGTH) {
      void submitCode(next.join("").slice(0, CODE_LENGTH));
    }
  }

  if (step === "verify") {
    return (
      <div className="grid gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            Enter the 6-digit code
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            We sent a code to {maskEmail(email)}. It expires in 10 minutes.
          </p>
        </div>

        <div className="flex justify-center gap-2" role="group" aria-label="Verification code">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(node) => {
                inputRefs.current[index] = node;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              autoComplete={index === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
              disabled={verifyStatus === "submitting"}
              value={digit}
              onChange={(event) => handleDigitChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              className="size-12 rounded-[var(--radius-control)] border border-[var(--color-border)] text-center text-xl font-bold text-[var(--color-text-primary)] focus-ring"
            />
          ))}
        </div>

        {error ? (
          <p role="alert" className="text-center text-sm text-[var(--color-danger)]">
            {error}
          </p>
        ) : null}

        <Button
          variant="ghost"
          type="button"
          loading={requestStatus === "submitting"}
          onClick={() => {
            setStep("request");
            setError(null);
          }}
        >
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={handleRequestCode}>
      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      {error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
      <Button type="submit" loading={requestStatus === "submitting"}>
        Email me a code
      </Button>
    </form>
  );
}
