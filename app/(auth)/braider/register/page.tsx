import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Join as a braider",
  description: "Apply to join Touch of Heaven as a braider, barber, or seller.",
};

const STEPS = [
  {
    title: "Create your account",
    description: "Sign up with your name, email, and password - takes under a minute.",
  },
  {
    title: "Submit your application",
    description:
      "Tell us which role you want (braider/barber, seller, or both) and a bit about your experience.",
  },
  {
    title: "Get reviewed",
    description: "An admin reviews every application. You'll hear back by email.",
  },
];

export default async function BraiderRegisterPage() {
  const user = await getCurrentUser();
  // Someone already signed in (as a customer, most likely) skips straight
  // to the real application form - no reason to send them through sign-up
  // again. Someone with no account yet signs up first, with callbackUrl
  // carrying them straight back here after.
  const applyHref = user
    ? "/professional-application"
    : "/sign-up?callbackUrl=%2Fprofessional-application";

  return (
    <section className="surface-panel w-full max-w-lg bg-white/92 p-6 shadow-[var(--shadow-soft)] backdrop-blur md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
        Touch of Heaven Studio
      </p>
      <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight text-[var(--color-text-primary)]">
        Join Touch of Heaven as a Braider
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
        Build your client base and grow your business.
      </p>

      <ol className="mt-6 grid gap-4">
        {STEPS.map((step, index) => (
          <li className="flex gap-3" key={step.title}>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--color-brand-soft)] text-sm font-bold text-[var(--color-brand-strong)]">
              {index + 1}
            </span>
            <span>
              <span className="block text-sm font-bold text-[var(--color-text-primary)]">
                {step.title}
              </span>
              <span className="block text-sm text-[var(--color-text-muted)]">
                {step.description}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <Link className="btn-primary mt-8 w-full justify-center" href={applyHref}>
        {user ? "Start your application" : "Create your account to apply"}
      </Link>

      <p className="mt-5 text-xs text-[var(--color-text-muted)]">
        Already applied?{" "}
        <Link className="font-semibold text-[var(--color-brand)]" href="/braider/sign-in">
          Sign in to check your status →
        </Link>
      </p>
    </section>
  );
}
