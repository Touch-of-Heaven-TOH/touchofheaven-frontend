export type LegalPolicy = {
  slug: string;
  title: string;
  effectiveDate: string;
  summary: string;
  primaryAction: string;
};

export const legalPolicies: LegalPolicy[] = [
  {
    slug: "terms",
    title: "Terms of Service",
    effectiveDate: "2026-08-01",
    summary:
      "Customer, braider, and administrator platform responsibilities, account rules, acceptable use, and dispute handling.",
    primaryAction: "Review service terms",
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    effectiveDate: "2026-08-01",
    summary:
      "How account, booking, consultation, payment, location, support, and analytics data are collected and protected.",
    primaryAction: "Review privacy rights",
  },
  {
    slug: "cookies",
    title: "Cookie Policy",
    effectiveDate: "2026-08-01",
    summary:
      "Essential security cookies, optional analytics preferences, and why authenticated cookies cannot be disabled.",
    primaryAction: "Review cookie choices",
  },
  {
    slug: "booking-policy",
    title: "Booking Policy",
    effectiveDate: "2026-08-01",
    summary:
      "Deposits, consultation requirements, appointment confirmation, rescheduling, and verified review eligibility.",
    primaryAction: "Review booking rules",
  },
  {
    slug: "cancellation",
    title: "Cancellation Policy",
    effectiveDate: "2026-08-01",
    summary:
      "Customer and braider cancellation windows, no-show handling, and notification expectations.",
    primaryAction: "Review cancellation windows",
  },
  {
    slug: "refund-policy",
    title: "Refund Policy",
    effectiveDate: "2026-08-01",
    summary:
      "Controlled refund workflows, payment-provider constraints, and admin-only refund authority.",
    primaryAction: "Review refund rules",
  },
  {
    slug: "shipping",
    title: "Shipping & Returns",
    effectiveDate: "2026-08-01",
    summary:
      "Delivery windows, carriers, and the return process for TOHAEM marketplace orders once the marketplace ships.",
    primaryAction: "Review shipping terms",
  },
  {
    slug: "seller-rules",
    title: "Seller Rules",
    effectiveDate: "2026-08-01",
    summary:
      "Standards for professionals selling through the TOHAEM marketplace: listing accuracy, fulfillment timelines, and prohibited items.",
    primaryAction: "Review seller standards",
  },
  {
    slug: "payout-policy",
    title: "Payout Policy",
    effectiveDate: "2026-08-01",
    summary:
      "How and when professional earnings become available for payout, minimum payout thresholds, and payout method requirements.",
    primaryAction: "Review payout terms",
  },
  {
    slug: "braider-conduct",
    title: "Braider Conduct",
    effectiveDate: "2026-08-01",
    summary:
      "Professional standards for appointments, client data handling, portfolio consent, and service accuracy.",
    primaryAction: "Review professional standards",
  },
  {
    slug: "dispute-policy",
    title: "Dispute Policy",
    effectiveDate: "2026-08-01",
    summary:
      "How support cases, evidence, appointment issues, and payment disputes move through resolution.",
    primaryAction: "Review dispute process",
  },
  {
    slug: "photo-consent",
    title: "Photo Consent",
    effectiveDate: "2026-08-01",
    summary:
      "Rules for consultation uploads, portfolio use, review media, and customer consent withdrawal.",
    primaryAction: "Review media consent",
  },
  {
    slug: "account-deletion",
    title: "Account Deletion",
    effectiveDate: "2026-08-01",
    summary:
      "Deletion request timing, cancellation window, records retained for legal reasons, and support escalation.",
    primaryAction: "Review deletion process",
  },
];

export function getLegalPolicy(slug: string): LegalPolicy | undefined {
  return legalPolicies.find((policy) => policy.slug === slug);
}
