export type WizardStepNumber = 1 | 2 | 3 | 4;

export const WIZARD_STEPS: {
  number: WizardStepNumber;
  slug: "type" | "details" | "services" | "review";
  title: string;
  subtitle: string;
}[] = [
  { number: 1, slug: "type", title: "Business type", subtitle: "Tell us what you do" },
  {
    number: 2,
    slug: "details",
    title: "Business details",
    subtitle: "Basic information about your business",
  },
  {
    number: 3,
    slug: "services",
    title: "Services & location",
    subtitle: "What you offer and where",
  },
  {
    number: 4,
    slug: "review",
    title: "Verify & review",
    subtitle: "Confirm and finish setup",
  },
];

export function wizardStepFromSlug(slug: string | undefined): WizardStepNumber {
  const found = WIZARD_STEPS.find((step) => step.slug === slug);
  return found?.number ?? 1;
}
