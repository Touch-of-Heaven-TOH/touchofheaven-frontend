import type { Metadata } from "next";
import { ProfessionalApplicationForm } from "@/features/professional-application/ProfessionalApplicationForm";
import { accountContent } from "@/config/page-content";

export const metadata: Metadata = {
  title: "Professional application",
  description: accountContent.application.description,
  robots: { index: false, follow: false },
};

export default function ProfessionalApplicationPage() {
  return (
    <section className="page-container py-12">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
          {accountContent.application.eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--color-brand-strong)]">
          {accountContent.application.title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
          Every account starts as a customer. Apply here to request braider/barber or seller
          access - an admin reviews every request before any role is granted.
        </p>
        <div className="mt-8">
          <ProfessionalApplicationForm />
        </div>
      </div>
    </section>
  );
}
