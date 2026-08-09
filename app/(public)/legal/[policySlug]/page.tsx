import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalPolicy, legalPolicies } from "@/config/legal";

type LegalPageProps = {
  params: Promise<{ policySlug: string }>;
};

export function generateStaticParams() {
  return legalPolicies.map((policy) => ({ policySlug: policy.slug }));
}

export async function generateMetadata({
  params,
}: LegalPageProps): Promise<Metadata> {
  const { policySlug } = await params;
  const policy = getLegalPolicy(policySlug);

  if (!policy) {
    return { title: "Policy not found" };
  }

  return {
    title: policy.title,
    description: policy.summary,
  };
}

export default async function LegalPolicyPage({ params }: LegalPageProps) {
  const { policySlug } = await params;
  const policy = getLegalPolicy(policySlug);

  if (!policy) notFound();

  return (
    <section className="page-container py-16">
      <p className="text-sm font-semibold uppercase text-[var(--color-brand)]">
        Legal policy
      </p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold text-[var(--color-text-primary)]">
        {policy.title}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        Effective {policy.effectiveDate}
      </p>
      <div className="surface-panel mt-8 p-6">
        <p className="text-base leading-8 text-[var(--color-text-muted)]">
          {policy.summary} The live version of this policy should be retrieved
          from the backend policy endpoint before production launch so customers
          always see the currently published version.
        </p>
      </div>
    </section>
  );
}
