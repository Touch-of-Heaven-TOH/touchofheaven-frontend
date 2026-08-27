"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ApiClientError } from "@/lib/api/errors";
import { browserApiFetch } from "@/lib/api/browser";
import { safeReturnUrl } from "@/lib/security/safe-return-url";

// The backend verifies email via a one-time link (a 43-character token in
// the URL, see modules/auth/auth.schemas.ts's verifyEmailSchema) - not a
// typed 6-digit code, so this reflects the real flow rather than the
// pictured code-entry UI.
const RESEND_COOLDOWN_SECONDS = 60;

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const visible = name.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(name.length - 2, 3))}@${domain}`;
}

export function BusinessVerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email") ?? "";
  const callbackUrl = searchParams.get("callbackUrl");

  const [state, setState] = useState<"pending" | "verifying" | "verified" | "error">(
    token ? "verifying" : "pending",
  );
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");
  const autoSubmitted = useRef(false);

  useEffect(() => {
    if (!token || autoSubmitted.current) return;
    autoSubmitted.current = true;

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
      <section className="surface-panel w-full bg-white p-6 text-center shadow-[var(--shadow-soft)] sm:p-8">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]">
          <CheckCircle2 aria-hidden="true" size={32} />
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
            router.push(safeReturnUrl(callbackUrl, "/professional-application"))
          }
          type="button"
        >
          Continue to business setup
        </button>
      </section>
    );
  }

  return (
    <section className="surface-panel w-full bg-white p-6 text-center shadow-[var(--shadow-soft)] sm:p-8">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
        <Mail aria-hidden="true" size={28} />
      </span>
      <h1 className="mt-4 font-serif text-3xl font-semibold text-[var(--color-text-primary)]">
        Verify your business email
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
        {state === "verifying"
          ? "Confirming your email..."
          : email
            ? `We sent a confirmation link to ${maskEmail(email)}. Click it to continue.`
            : "Check your inbox for the confirmation link we sent you."}
      </p>

      {state === "error" && error ? (
        <p
          className="mt-4 rounded-md bg-[var(--color-danger-soft)] p-3 text-left text-sm text-[var(--color-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {email ? (
        <button
          className="btn-secondary mt-6 w-full"
          disabled={cooldown > 0 || resendStatus === "sending"}
          onClick={handleResend}
          type="button"
        >
          {resendStatus === "sending"
            ? "Sending..."
            : cooldown > 0
              ? `Resend in 00:${cooldown.toString().padStart(2, "0")}`
              : "Resend email"}
        </button>
      ) : null}

      <p className="mt-5 text-sm text-[var(--color-text-muted)]">
        <Link className="font-semibold text-[var(--color-brand)]" href="/business/sign-in">
          Back to sign in
        </Link>
      </p>
    </section>
  );
}
