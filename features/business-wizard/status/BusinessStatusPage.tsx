"use client";

import Link from "next/link";
import { CircleDashed, Headset, Lock, Mail, ShieldCheck, User } from "lucide-react";

export function BusinessStatusPage({
  firstName,
  businessName,
}: {
  firstName: string;
  businessName: string;
}) {
  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-[var(--color-border)] bg-white p-8">
      <div className="flex flex-col items-center text-center">
        <span className="grid size-16 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]">
          <ShieldCheck aria-hidden="true" size={32} />
        </span>
        <h1 className="mt-4 font-serif text-3xl font-semibold text-[var(--color-text-primary)]">
          Your business is under review
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Thank you, {firstName}. We&apos;ve received the {businessName} application.
        </p>
        <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-gold-soft,var(--color-brand-soft))] px-4 py-1.5 text-xs font-semibold text-[var(--color-brand-strong)]">
          <CircleDashed aria-hidden="true" size={14} />
          Verification in progress
        </span>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-2">
        <StatusStep active complete label="Submitted" sublabel="Completed" />
        <StatusStep active label="Identity review" sublabel="In progress" />
        <StatusStep label="Decision" sublabel="Upcoming" />
      </div>

      <div className="mt-8 rounded-xl border border-[var(--color-border)]">
        <h2 className="border-b border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)]">
          What happens next?
        </h2>
        <ul className="divide-y divide-[var(--color-border)] text-sm text-[var(--color-text-primary)]">
          <li className="flex items-center gap-3 px-4 py-3">
            <User aria-hidden="true" className="shrink-0 text-[var(--color-text-muted)]" size={18} />
            We&apos;ll review your identity and business information.
          </li>
          <li className="flex items-center gap-3 px-4 py-3">
            <Mail aria-hidden="true" className="shrink-0 text-[var(--color-text-muted)]" size={18} />
            If anything is missing, you&apos;ll receive a secure notification.
          </li>
          <li className="flex items-center gap-3 px-4 py-3">
            <ShieldCheck aria-hidden="true" className="shrink-0 text-[var(--color-text-muted)]" size={18} />
            Your profile can be published after approval.
          </li>
        </ul>
      </div>

      <p className="mt-4 rounded-lg bg-[var(--color-brand-soft)] p-4 text-sm text-[var(--color-brand-strong)]">
        You can continue preparing services, availability and your portfolio while we review your
        application.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link className="btn-primary flex-1 text-center" href="/">
          Open business workspace
        </Link>
        <Link className="btn-secondary flex-1 text-center" href="/business/setup/review">
          View submitted information
        </Link>
      </div>

      <p className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
        <Headset aria-hidden="true" size={16} />
        Need help?{" "}
        <Link className="font-semibold text-[var(--color-brand)]" href="/contact">
          Contact support
        </Link>
      </p>

      <p className="mt-3 flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)]">
        <Lock aria-hidden="true" size={12} />
        We will never ask you to send verification documents by email.
      </p>
    </section>
  );
}

function StatusStep({
  label,
  sublabel,
  active,
  complete,
}: {
  label: string;
  sublabel: string;
  active?: boolean;
  complete?: boolean;
}) {
  return (
    <div className="text-center">
      <span
        className={`mx-auto grid size-9 place-items-center rounded-full border-2 text-sm font-semibold ${
          complete
            ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
            : active
              ? "border-[var(--color-brand)] text-[var(--color-brand)]"
              : "border-[var(--color-border)] text-[var(--color-text-muted)]"
        }`}
      >
        {complete ? "✓" : ""}
      </span>
      <p className="mt-2 text-xs font-semibold text-[var(--color-text-primary)]">{label}</p>
      <p className="text-xs text-[var(--color-text-muted)]">{sublabel}</p>
    </div>
  );
}
