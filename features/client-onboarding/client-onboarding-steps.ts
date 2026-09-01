import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CalendarDays,
  Check,
  Heart,
  Lock,
  MapPin,
  ShieldCheck,
  User,
} from "lucide-react";

export type ClientOnboardingStepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type ClientOnboardingStepSlug =
  | "welcome"
  | "profile"
  | "contact"
  | "verify-phone"
  | "location"
  | "services"
  | "booking"
  | "notifications"
  | "privacy"
  | "complete";

export type ClientOnboardingStep = {
  number: ClientOnboardingStepNumber;
  slug: ClientOnboardingStepSlug;
  title: string;
  section: "About you" | "Your preferences" | "Communication" | "Privacy & finish";
  sidebarSubtitle: string;
  icon: LucideIcon;
};

export const CLIENT_ONBOARDING_STEPS: ClientOnboardingStep[] = [
  {
    number: 1,
    slug: "welcome",
    title: "Welcome",
    section: "About you",
    sidebarSubtitle: "Tell us a bit about yourself",
    icon: ShieldCheck,
  },
  {
    number: 2,
    slug: "profile",
    title: "Basic profile",
    section: "About you",
    sidebarSubtitle: "Tell us a bit about yourself",
    icon: User,
  },
  {
    number: 3,
    slug: "contact",
    title: "Contact details",
    section: "Communication",
    sidebarSubtitle: "Choose how we keep in touch",
    icon: Bell,
  },
  {
    number: 4,
    slug: "verify-phone",
    title: "Mobile verification",
    section: "Communication",
    sidebarSubtitle: "Choose how we keep in touch",
    icon: Lock,
  },
  {
    number: 5,
    slug: "location",
    title: "Location preferences",
    section: "Your preferences",
    sidebarSubtitle: "Help us tailor your experience",
    icon: MapPin,
  },
  {
    number: 6,
    slug: "services",
    title: "Service interests",
    section: "Your preferences",
    sidebarSubtitle: "Help us tailor your experience",
    icon: Heart,
  },
  {
    number: 7,
    slug: "booking",
    title: "Booking preferences",
    section: "Your preferences",
    sidebarSubtitle: "Help us tailor your experience",
    icon: CalendarDays,
  },
  {
    number: 8,
    slug: "notifications",
    title: "Notifications",
    section: "Communication",
    sidebarSubtitle: "Choose how we keep in touch",
    icon: Bell,
  },
  {
    number: 9,
    slug: "privacy",
    title: "Privacy and consent",
    section: "Privacy & finish",
    sidebarSubtitle: "Review and finish setup",
    icon: Lock,
  },
  {
    number: 10,
    slug: "complete",
    title: "Profile complete",
    section: "Privacy & finish",
    sidebarSubtitle: "Review and finish setup",
    icon: Check,
  },
];

export const CLIENT_ONBOARDING_SECTION_STEPS = [
  {
    number: 1,
    title: "About you",
    subtitle: "Tell us a bit about yourself",
    startsAt: 1,
    endsAt: 2,
  },
  {
    number: 2,
    title: "Your preferences",
    subtitle: "Help us tailor your experience",
    startsAt: 5,
    endsAt: 7,
  },
  {
    number: 3,
    title: "Communication",
    subtitle: "Choose how we keep in touch",
    startsAt: 3,
    endsAt: 8,
  },
  {
    number: 4,
    title: "Privacy & finish",
    subtitle: "Review and finish setup",
    startsAt: 9,
    endsAt: 10,
  },
] as const;

export function stepFromSlug(slug: string | undefined): ClientOnboardingStep {
  return (
    CLIENT_ONBOARDING_STEPS.find((step) => step.slug === slug) ??
    CLIENT_ONBOARDING_STEPS[0]
  );
}

export function stepByNumber(number: number): ClientOnboardingStep {
  return (
    CLIENT_ONBOARDING_STEPS.find((step) => step.number === number) ??
    CLIENT_ONBOARDING_STEPS[0]
  );
}

export function nextStepSlug(current: ClientOnboardingStepNumber) {
  return CLIENT_ONBOARDING_STEPS.find((step) => step.number === current + 1)?.slug;
}

export function previousStepSlug(current: ClientOnboardingStepNumber) {
  return CLIENT_ONBOARDING_STEPS.find((step) => step.number === current - 1)?.slug;
}
