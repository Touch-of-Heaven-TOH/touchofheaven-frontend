"use client";

import {
  Accessibility,
  ArrowRight,
  BookOpen,
  LifeBuoy,
  Mail,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Card, PageHeader } from "@/features/studio/components/ui/primitives";

const GUIDES = [
  { label: "Booking policy", href: "/legal/booking-policy" },
  { label: "Cancellation policy", href: "/legal/cancellation" },
  { label: "Refund policy", href: "/legal/refund-policy" },
  { label: "Payout policy", href: "/legal/payout-policy" },
  { label: "Terms of service", href: "/legal/terms" },
  { label: "Privacy policy", href: "/legal/privacy" },
];

export function StudioHelp() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Help & support"
        icon={LifeBuoy}
        description="Answers, policies and a real person when you need one."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Contact support" icon={MessageCircle}>
          <div id="contact" className="grid scroll-mt-28 gap-4">
            <p className="text-[15px] text-[var(--color-text-muted)]">
              Our team answers business questions about bookings, payments, refunds and payouts,
              usually within one working day.
            </p>
            <div className="flex flex-wrap gap-2">
              <a href={`mailto:${siteConfig.supportEmail}`} className="btn-primary">
                <Mail aria-hidden="true" className="size-4" />
                Email support
              </a>
              <Link href="/contact" className="btn-secondary">
                Contact form
              </Link>
            </div>
            <p className="text-sm break-all text-[var(--color-text-muted)]">{siteConfig.supportEmail}</p>
          </div>
        </Card>

        <Card title="Policies & guides" icon={BookOpen}>
          <ul className="grid gap-1">
            {GUIDES.map((guide) => (
              <li key={guide.href}>
                <Link
                  href={guide.href}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 text-[15px] text-[var(--color-text-primary)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"
                >
                  {guide.label}
                  <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Accessibility" icon={Accessibility}>
        <div id="accessibility" className="grid max-w-3xl scroll-mt-28 gap-3 text-[15px] text-[var(--color-text-muted)]">
          <p>
            The Business Studio is built to work with a keyboard, screen readers, zoom up to 200% and
            reduced-motion settings. Status is always written out in words, never shown by colour alone,
            and every chart can be switched to a table.
          </p>
          <p>
            If something is hard to use, email us at{" "}
            <a href={`mailto:${siteConfig.supportEmail}`} className="text-[var(--color-brand)] underline">
              {siteConfig.supportEmail}
            </a>{" "}
            and tell us the page and what happened. We treat accessibility problems as bugs.
          </p>
        </div>
      </Card>
    </div>
  );
}
