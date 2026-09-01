"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api/errors";
import { browserApiFetch } from "@/lib/api/browser";
import { VerificationCodeInput } from "@/features/auth/components/VerificationCodeInput";

const RESEND_COOLDOWN_SECONDS = 60;

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const visible = name.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(name.length - 2, 3))}@${domain}`;
}

export function CustomerVerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email") ?? "";

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
        body: { email, audience: "client" },
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
      <section className="surface-panel w-full max-w-md bg-white/92 p-6 text-center shadow-[var(--shadow-soft)] backdrop-blur md:p-8">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]">
          <Check aria-hidden="true" size={32} />
        </span>
        <h1 className="mt-4 font-serif text-3xl font-semibold text-[var(--color-text-primary)]">
          Email verified
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Your account is ready to go.
        </p>
        <Link
          className="btn-primary mt-6 w-full"
          href="/customer/sign-in?callbackUrl=%2Fclient-onboarding"
        >
          Continue to setup
        </Link>
      </section>
    );
  }

  return (
    <section className="surface-panel w-full max-w-md bg-white/92 p-6 text-center shadow-[var(--shadow-soft)] backdrop-blur md:p-8">
      <span className="relative mx-auto grid size-16 place-items-center text-[var(--color-copper)]">
        <Mail aria-hidden="true" size={44} strokeWidth={1.5} />
        <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-white bg-[var(--color-page)] text-[var(--color-text-muted)]">
          <Check aria-hidden="true" size={12} />
        </span>
      </span>
      <h1 className="mt-4 font-serif text-3xl font-semibold text-[var(--color-text-primary)]">
        Verify your email
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

      <p className="mt-3 text-sm text-[var(--color-text-muted)]">
        <Link className="font-semibold text-[var(--color-brand)]" href="/customer/sign-in">
          Back to sign in
        </Link>
      </p>
    </section>
  );
}
