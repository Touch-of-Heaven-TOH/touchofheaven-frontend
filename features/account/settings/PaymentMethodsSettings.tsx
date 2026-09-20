"use client";

// TODO: wire to Stripe payment methods API once endpoint exists.
// Nothing on this page is faked in the meantime: there are no saved cards
// to list because the platform cannot save one yet. Two things are needed
// before the "Add a card" button can do its job:
//   1. A backend endpoint that creates a Stripe SetupIntent for the signed-in
//      client and lists/removes their saved payment methods.
//   2. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY plus @stripe/stripe-js and
//      @stripe/react-stripe-js, none of which this app depends on today,
//      so the card form can be mounted with Stripe Elements.
// Until then this screen explains where deposits are paid instead.

import Link from "next/link";
import { CreditCard, Info, ShieldCheck } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import { useState } from "react";
import { SettingsShell } from "@/features/account/settings/SettingsShell";

export function PaymentMethodsSettings() {
  const [explainerOpen, setExplainerOpen] = useState(false);

  return (
    <SettingsShell
      current="payment-methods"
      title="Payment methods"
      description="Cards saved for deposits, so you don't type them in for every booking."
    >
      <div className="grid gap-5">
        <section className="grid justify-items-center gap-3 rounded-[var(--radius-control)] border border-dashed border-[var(--color-border)] bg-white px-5 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
            <CreditCard aria-hidden="true" size={24} />
          </span>
          <h2 className="font-serif text-2xl font-semibold">No payment methods saved</h2>
          <p className="max-w-md text-sm text-[var(--color-text-muted)]">
            Saving a card isn&apos;t switched on yet. You can still book: you pay the deposit at the
            end of the booking, and the rest at your appointment.
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={() => setExplainerOpen(true)}>
              Add a card
            </Button>
            <Link
              href="/explore"
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-5 text-sm font-bold text-[var(--color-brand)] transition hover:border-[var(--color-brand)]"
            >
              Find a provider
            </Link>
          </div>
        </section>

        <section className="surface-panel flex items-start gap-3 p-5">
          <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--color-gold)]" size={20} />
          <div>
            <h2 className="font-semibold text-[var(--color-text-primary)]">How deposits are paid</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              A deposit is taken when you book and holds your time. Card details are handled by the
              payment provider, never stored by Touch of Heaven.{" "}
              <Link className="font-semibold text-[var(--color-brand)] hover:underline" href="/legal/booking-policy">
                Read the booking policy
              </Link>
            </p>
          </div>
        </section>
      </div>

      <Modal
        open={explainerOpen}
        onClose={() => setExplainerOpen(false)}
        title="Saving a card isn't available yet"
      >
        <div className="grid gap-3 text-sm text-[var(--color-text-muted)]">
          <p className="flex items-start gap-2">
            <Info aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--color-brand)]" size={16} />
            We&apos;d rather tell you this than show a card form that can&apos;t save anything.
          </p>
          <p>
            Deposits are paid during booking today. Once saved cards are switched on, they&apos;ll
            appear here and you&apos;ll be able to set a default.
          </p>
          <div className="pt-2">
            <Button type="button" onClick={() => setExplainerOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </SettingsShell>
  );
}
