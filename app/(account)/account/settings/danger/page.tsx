import type { Metadata } from "next";
import Link from "next/link";
import { accountContent } from "@/config/page-content";

const content = accountContent.danger;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

export default function AccountSettingsDangerPage() {
  return (
    <section className="grid gap-6">
      <div className="surface-panel p-6">
        <p className="text-xs font-semibold uppercase text-[var(--color-brand)]">
          {content.eyebrow}
        </p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold text-[var(--color-text-primary)]">
          {content.title}
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">
          {content.description}
        </p>
      </div>

      <div className="rounded-lg border-2 border-red-300 bg-red-50 p-6">
        <p className="text-xs font-bold tracking-wide text-red-700 uppercase">
          Irreversible after the waiting period
        </p>
        <h3 className="mt-2 text-xl font-semibold text-red-900">
          Delete my account
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-red-800">
          Requesting deletion starts a 30-day waiting period. During those 30
          days, signing back in automatically cancels the request and nothing
          is lost. After 30 days, your profile, saved preferences, and any
          data this platform is not legally required to retain (like
          completed-appointment financial records) are permanently deleted
          and cannot be recovered. Appointments, orders, and payment records
          this platform must keep for legal, tax, or dispute-resolution
          reasons are retained on the schedule required by law, even after
          your account is deleted - see{" "}
          <Link className="font-semibold underline" href="/legal/account-deletion">
            the Account Deletion &amp; Retention policy
          </Link>{" "}
          for exactly what that covers.
        </p>
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Not yet connected to the backend deletion workflow - see BACKEND_ADDITIONS.md"
          className="mt-5 rounded-md border-2 border-red-400 bg-white px-4 py-2 text-sm font-semibold text-red-700 opacity-60"
        >
          Request account deletion
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {content.statusItems.map((item) => (
          <div className="surface-panel p-4" key={item}>
            <p className="text-sm leading-6 text-[var(--color-text-muted)]">
              {item}
            </p>
          </div>
        ))}
      </div>

      {content.endpoint ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          Backend contract: <code>{content.endpoint}</code>
        </p>
      ) : null}
    </section>
  );
}
