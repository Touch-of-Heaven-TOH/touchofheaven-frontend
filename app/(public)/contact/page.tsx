import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Touch of Heaven support for booking or account help.",
};

export default function ContactPage() {
  return (
    <section className="page-container grid gap-8 py-16 md:grid-cols-[0.8fr_1.2fr]">
      <div>
        <p className="text-sm font-semibold uppercase text-[var(--color-brand)]">
          Support
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--color-text-primary)]">
          Get help with booking, accounts, or professional access.
        </h1>
      </div>
      <div className="surface-panel p-6">
        <p className="text-base leading-7 text-[var(--color-text-muted)]">
          Use the protected support center once signed in so the backend can
          attach the case to your account. For public launch questions, email
          <a className="ml-1 font-semibold text-[var(--color-brand)]" href={`mailto:${siteConfig.supportEmail}`}>
            {siteConfig.supportEmail}
          </a>
          .
        </p>
      </div>
    </section>
  );
}
