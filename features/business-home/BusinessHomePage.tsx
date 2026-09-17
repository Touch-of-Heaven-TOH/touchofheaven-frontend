import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChartColumn,
  ClipboardList,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { PlatformStats } from "@/features/business-home/api";

/**
 * The home page for someone who wants to offer services, as opposed to the
 * client home page at "/". The public header switches between the two.
 *
 * Content is deliberately plain and true: it describes what the Business
 * Studio already does. The numbers come from the backend, and the page hides
 * them rather than showing invented ones when that call fails.
 */

const STEPS = [
  {
    icon: ClipboardList,
    title: "Tell us about your business",
    detail:
      "Your name, where you work, your services and prices, and the documents that prove you are who you say you are.",
  },
  {
    icon: BadgeCheck,
    title: "Get verified",
    detail:
      "We check your details before your page goes live, so clients booking you know the business is real.",
  },
  {
    icon: CalendarDays,
    title: "Take bookings",
    detail:
      "Clients see your real availability, pay a deposit to confirm, and the appointment lands in your calendar.",
  },
];

const TOOLS = [
  {
    icon: CalendarDays,
    title: "Calendar and bookings",
    detail:
      "Your day at a glance, with check-in, reschedules, cancellations and no-shows handled in one place.",
  },
  {
    icon: Users,
    title: "Clients",
    detail: "Every client's history, spend, notes and no-shows, built from the bookings you complete.",
  },
  {
    icon: CreditCard,
    title: "Deposits and payouts",
    detail:
      "Deposits are collected when a client books. Record the balance you take in person, add tips, and follow your payouts.",
  },
  {
    icon: ShieldCheck,
    title: "Your cancellation policy",
    detail:
      "Pick the policy each service is booked under. Refunds follow it automatically, judged at the moment the client asked.",
  },
  {
    icon: Users,
    title: "Your team",
    detail:
      "Invite staff and give each person only what they need: a stylist sees their own appointments, a receptionist never sees your earnings.",
  },
  {
    icon: ChartColumn,
    title: "Earnings and analytics",
    detail: "What you earned, what is still owed, and how your bookings and repeat clients are trending.",
  },
];

const FAQS = [
  {
    question: "What does it cost?",
    answer:
      "Pricing is not published yet. Nothing is charged while you set your business up, and you will see the terms before anything is taken.",
  },
  {
    question: "Do I need a shop?",
    answer:
      "No. You can work from a salon, a private studio at home, or travel to clients. A private studio's exact address is only shared with a client once their booking is confirmed.",
  },
  {
    question: "Can I keep my own hours?",
    answer:
      "Yes. You set your working hours, breaks, time off and how much notice you need, and clients can only book inside them.",
  },
  {
    question: "What if a client does not turn up?",
    answer:
      "Record it as a no-show after the grace period. Your policy decides what happens to the deposit, and it stays on the client's record.",
  },
];

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[var(--radius-control)] border border-white/15 bg-white/5 px-5 py-4">
      <p className="font-serif text-3xl font-semibold text-[var(--color-gold-light)]">{value}</p>
      <p className="mt-1 text-sm text-white/75">{label}</p>
    </div>
  );
}

export function BusinessHomePage({ stats, isSignedIn }: { stats: PlatformStats | null; isSignedIn: boolean }) {
  return (
    <div className="bg-[var(--color-page)]">
      <section className="bg-[var(--color-brand-strong)] text-white">
        <div className="page-container grid gap-10 py-12 md:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/8 px-4 py-2 text-xs font-bold tracking-[0.18em] uppercase text-[var(--color-gold-light)]">
              <Sparkles aria-hidden="true" size={15} />
              For business owners
            </p>
            <h1 className="mt-7 max-w-3xl font-serif text-[2.65rem] leading-[0.98] font-semibold sm:text-5xl md:text-6xl md:leading-[0.96]">
              Run your beauty business, and let clients book it.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/78 md:text-lg">
              Touch of Heaven gives you a page clients can find, a calendar they can book, deposits that hold
              the slot, and the tools to run the day: check-in, rescheduling, refunds, your team and your
              earnings.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary min-h-14 justify-center px-6" href={isSignedIn ? "/business/setup" : "/business/sign-up"}>
                {isSignedIn ? "Set up your business" : "Create your business account"}
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-white/25 px-6 font-semibold text-white transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold-light)]"
                href="/business/sign-in"
              >
                Sign in to your Studio
              </Link>
            </div>
            <p className="mt-4 text-sm text-white/70">
              Looking to book an appointment instead?{" "}
              <Link className="font-semibold text-[var(--color-gold-light)] underline" href="/">
                Go to the client home page
              </Link>
              .
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {stats ? (
              <>
                <StatBlock value={stats.verifiedBusinesses.toLocaleString()} label="Verified businesses listed" />
                <StatBlock value={stats.publishedServices.toLocaleString()} label="Services clients can book" />
                <StatBlock
                  value={stats.completedAppointments.toLocaleString()}
                  label="Appointments completed"
                />
              </>
            ) : null}
            <div className="rounded-[var(--radius-control)] border border-white/15 bg-white/5 px-5 py-4">
              <p className="font-serif text-xl font-semibold text-[var(--color-gold-light)]">
                Verified before you go live
              </p>
              <p className="mt-1 text-sm text-white/75">
                Every business is checked, so the ones clients find are real.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-container py-12 md:py-16" id="how-it-works">
        <p className="text-xs font-bold tracking-[0.18em] uppercase text-[var(--color-brand)]">How it works</p>
        <h2 className="mt-2 font-serif text-4xl font-semibold text-[var(--color-brand-strong)] md:text-5xl">
          Three steps to your first booking.
        </h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li className="surface-panel p-6" key={step.title}>
              <span className="grid size-12 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                <step.icon aria-hidden="true" size={24} />
              </span>
              <p className="mt-4 text-sm font-bold text-[var(--color-brand)]">Step {index + 1}</p>
              <h3 className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">{step.title}</h3>
              <p className="mt-2 leading-7 text-[var(--color-text-muted)]">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-[var(--color-surface)] py-12 md:py-16" id="studio">
        <div className="page-container">
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-[var(--color-brand)]">
            Your Business Studio
          </p>
          <h2 className="mt-2 max-w-3xl font-serif text-4xl font-semibold text-[var(--color-brand-strong)] md:text-5xl">
            Everything that happens after a client books.
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {TOOLS.map((tool) => (
              <div className="surface-panel p-6" key={tool.title}>
                <span className="grid size-11 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                  <tool.icon aria-hidden="true" size={22} />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">{tool.title}</h3>
                <p className="mt-2 leading-7 text-[var(--color-text-muted)]">{tool.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-container py-12 md:py-16" id="questions">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] uppercase text-[var(--color-brand)]">Questions</p>
            <h2 className="mt-2 font-serif text-4xl font-semibold text-[var(--color-brand-strong)]">
              Before you decide.
            </h2>
            <p className="mt-4 leading-7 text-[var(--color-text-muted)]">
              Still deciding? Talk to us first, or read what clients see on the other side of the platform.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="btn-secondary" href="/contact">
                <MessageCircle aria-hidden="true" size={18} />
                Talk to us
              </Link>
              <Link className="btn-secondary" href="/">
                Client home page
              </Link>
            </div>
          </div>
          <dl className="grid gap-4">
            {FAQS.map((faq) => (
              <div className="surface-panel p-6" key={faq.question}>
                <dt className="text-lg font-semibold text-[var(--color-text-primary)]">{faq.question}</dt>
                <dd className="mt-2 leading-7 text-[var(--color-text-muted)]">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-[var(--color-brand-strong)] py-12 text-white md:py-16">
        <div className="page-container flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="max-w-2xl font-serif text-4xl font-semibold md:text-5xl">
              Set up your business today.
            </h2>
            <p className="mt-3 max-w-xl text-white/78">
              It takes a few minutes. You can save and come back before sending it for verification.
            </p>
          </div>
          <Link className="btn-primary min-h-14 justify-center px-6" href={isSignedIn ? "/business/setup" : "/business/sign-up"}>
            {isSignedIn ? "Set up your business" : "Create your business account"}
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
