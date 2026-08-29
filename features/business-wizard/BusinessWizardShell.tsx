"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloudCheck, Save } from "lucide-react";
import type { ReactNode } from "react";
import { brandAssets, siteConfig } from "@/config/site";
import {
  WizardStepperDesktop,
  WizardStepperMobile,
} from "@/features/business-wizard/WizardStepper";
import type { WizardStepNumber } from "@/features/business-wizard/wizard-steps";

export type BusinessWizardShellProps = {
  currentStep: WizardStepNumber;
  userFirstName: string;
  children: ReactNode;
};

function initialsOf(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function BusinessWizardShell({
  currentStep,
  userFirstName,
  children,
}: BusinessWizardShellProps) {
  const router = useRouter();

  return (
    <div className="grid min-h-dvh grid-rows-[auto_auto_1fr] lg:grid-cols-[320px_minmax(0,1fr)] lg:grid-rows-1">
      <aside className="hidden bg-[var(--color-brand-strong)] px-8 py-10 text-white lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col">
        <Link
          aria-label={`${siteConfig.name} home`}
          className="flex items-center gap-3"
          href="/"
        >
          <span className="relative block size-10 shrink-0">
            <Image
              alt=""
              className="object-contain"
              fill
              priority
              sizes="40px"
              src={brandAssets.logoMark}
            />
          </span>
          <span className="font-serif text-xl tracking-[0.1em] text-[var(--color-gold-light)]">
            {siteConfig.shortName}
          </span>
        </Link>

        <h2 className="mt-8 font-serif text-2xl font-semibold text-[var(--color-gold-light)]">
          Set up your business
        </h2>
        <div className="mt-3 h-px w-16 bg-[var(--color-gold)]" />

        <WizardStepperDesktop currentStep={currentStep} />

        <div className="mt-auto flex items-center gap-2 border-t border-white/15 pt-6 text-sm text-white/70">
          <CloudCheck aria-hidden="true" size={18} />
          Your progress saves automatically.
        </div>
      </aside>

      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-white px-4 py-4 sm:px-6 lg:hidden">
        <Link
          aria-label={`${siteConfig.name} home`}
          className="flex items-center gap-2"
          href="/"
        >
          <span className="relative block size-8 shrink-0">
            <Image
              alt=""
              className="object-contain"
              fill
              priority
              sizes="32px"
              src={brandAssets.logoMark}
            />
          </span>
        </Link>
        <span className="font-serif text-base font-semibold text-[var(--color-text-primary)]">
          Set up your business
        </span>
        <button
          className="text-sm font-semibold text-[var(--color-brand)]"
          onClick={() => router.push("/")}
          type="button"
        >
          Save &amp; exit
        </button>
      </header>

      <div className="flex flex-col lg:col-start-2 lg:row-start-1">
        <div className="hidden items-center justify-end gap-4 border-b border-[var(--color-border)] bg-white px-8 py-4 lg:flex">
          <button
            className="btn-secondary inline-flex items-center gap-2"
            onClick={() => router.push("/")}
            type="button"
          >
            <Save aria-hidden="true" size={16} />
            Save &amp; exit
          </button>
          <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
            <span className="grid size-8 place-items-center rounded-full bg-[var(--color-brand-soft)] text-sm font-bold text-[var(--color-brand-strong)]">
              {initialsOf(userFirstName)}
            </span>
            {userFirstName}
          </span>
        </div>

        <div className="bg-[var(--color-page)] px-4 py-6 sm:px-6 lg:hidden">
          <WizardStepperMobile currentStep={currentStep} />
        </div>

        <main className="flex-1 bg-[var(--color-page)] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-3xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
