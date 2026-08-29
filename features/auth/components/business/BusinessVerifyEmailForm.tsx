"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api/errors";
import { browserApiFetch } from "@/lib/api/browser";
import { safeReturnUrl } from "@/lib/security/safe-return-url";
import { VerificationCodeInput } from "@/features/auth/components/VerificationCodeInput";

const RESEND_COOLDOWN_SECONDS = 60;

const STEPS = [
  { label: "Account created" },
  { label: "Email verification" },
  { label: "Business setup" },
];

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const visible = name.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(name.length - 2, 3))}@${domain}`;
}

function Stepper({ current }: { current: number }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-2 sm:mb-8">
      {STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const isComplete = stepNumber < current;
        const isCurrent = stepNumber === current;

        return (
          <div className="flex flex-1 items-center last:flex-none" key={step.label}>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-full border-2 text-sm font-bold ${
                  isComplete
                    ? "border-[var(--color-success)] bg-[var(--color-success)] text-white"
                    : isCurrent
                      ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                      : "border-[var(--color-border)] bg-white text-[var(--color-text-muted)]"
                }`}
              >
                {isComplete ? <Check aria-hidden="true" size={16} /> : stepNumber}
              </span>
              <span
                className={`text-xs font-semibold ${
                  isCurrent ? "text-[var(--color-brand)]" : "text-[var(--color-text-muted)]"
                }`}
              >
                {step.label}
              </span>
            </div>
            {stepNumber < STEPS.length ? (
              <span
                aria-hidden="true"
                className={`mx-2 h-px flex-1 ${
                  isComplete ? "bg-[var(--color-success)]" : "bg-[var(--color-border)]"
                }`}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function BusinessVerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email") ?? "";
  const callbackUrl = searchParams.get("callbackUrl");

  const [code, setCode] = useState("");
  const [state, setState] = useState<"pending" | "verifying" | "verified" | "error">(
    token ? "verifying" : "pending",
  );
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    if (!token) return;

    browserApiFetch("/api/v1/auth/verify-email", {
      method: "POST",
      body: { token },
    })
      .then(() => setState("verified"))
      .catch((caught) => {
        setState("error");
        setError(
          caught instanceof ApiClientError
            ? caught.message
            : "This verification link is invalid or has expired.",
        );
      });
  }, [token]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((value) => Math.max(value - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function submitCode(rawCode: string) {
    setState("verifying");
    setError(null);
    try {
      await browserApiFetch("/api/v1/auth/verify-email/code", {
        method: "POST",
        body: { email, code: rawCode },
      });
      setState("verified");
    } catch (caught) {
      setState("pending");
      setCode("");
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "That code is invalid or has expired.",
      );
    }
  }

  async function handleResend() {
    setResendStatus("sending");
    try {
      await browserApiFetch("/api/v1/auth/resend-verification", {
        method: "POST",
        body: { email, audience: "business" },
      });
      setResendStatus("sent");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (caught) {
      setResendStatus("idle");
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "We could not resend that email. Try again shortly.",
      );
    }
  }

  if (state === "verified") {
    return (
      <div>
        <Stepper current={3} />
        <section className="surface-panel w-full bg-white p-6 text-center shadow-[var(--shadow-soft)] sm:p-8">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]">
            <Check aria-hidden="true" size={32} />
          </span>
          <h1 className="mt-4 font-serif text-3xl font-semibold text-[var(--color-text-primary)]">
            Email verified
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            Your business email is confirmed. Let&apos;s set up your business next.
          </p>
          <button
            className="btn-primary mt-6 w-full"
            onClick={() =>
              router.push(safeReturnUrl(callbackUrl, "/business/setup"))
            }
            type="button"
          >
            Continue to business setup
          </button>
        </section>
      </div>
    );
  }

  return (
    <div>
      <Stepper current={2} />
      <section className="surface-panel w-full bg-white p-6 text-center shadow-[var(--shadow-soft)] sm:p-8">
        <span className="relative mx-auto grid size-16 place-items-center text-[var(--color-copper)]">
          <Mail aria-hidden="true" size={44} strokeWidth={1.5} />
          <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-white bg-[var(--color-page)] text-[var(--color-text-muted)]">
            <Check aria-hidden="true" size={12} />
          </span>
        </span>
        <h1 className="mt-4 font-serif text-3xl font-semibold text-[var(--color-text-primary)]">
          Verify your business email
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          {email
            ? `We sent a 6-digit code to ${maskEmail(email)}`
            : "We sent a 6-digit code to your email"}
        </p>

        <div className="mt-6">
          <VerificationCodeInput
            disabled={state === "verifying"}
            onChange={setCode}
            onComplete={submitCode}
            value={code}
          />
        </div>

        {error ? (
          <p
            className="mt-4 rounded-md bg-[var(--color-danger-soft)] p-3 text-left text-sm text-[var(--color-danger)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button
          className="btn-primary mt-6 w-full"
          disabled={state === "verifying" || code.length < 6}
          onClick={() => submitCode(code)}
          type="button"
        >
          {state === "verifying" ? "Verifying..." : "Verify email"}
        </button>

        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          Didn&apos;t receive the code?{" "}
          {cooldown > 0 ? (
            <span className="font-semibold text-[var(--color-brand)]">
              Resend in 00:{cooldown.toString().padStart(2, "0")}
            </span>
          ) : (
            <button
              className="font-semibold text-[var(--color-brand)]"
              disabled={resendStatus === "sending"}
              onClick={handleResend}
              type="button"
            >
              {resendStatus === "sending" ? "Sending..." : "Resend"}
            </button>
          )}
        </p>

        <p className="mt-3 flex items-center justify-center gap-3 text-sm">
          <Link className="font-semibold text-[var(--color-brand)]" href="/business/sign-up">
            Change email
          </Link>
          <span aria-hidden="true" className="text-[var(--color-border)]">
            |
          </span>
          <Link className="font-semibold text-[var(--color-brand)]" href="/business/sign-in">
            Back to sign in
          </Link>
        </p>

        <div className="mt-6 flex items-start gap-3 border-t border-[var(--color-border)] pt-5 text-left text-xs text-[var(--color-text-muted)]">
          <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
          For your protection, this code expires in 10 minutes.
        </div>
      </section>
    </div>
  );
}
