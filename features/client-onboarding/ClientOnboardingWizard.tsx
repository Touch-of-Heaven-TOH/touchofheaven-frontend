"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  Circle,
  Clock,
  Cloud,
  FileText,
  Hand,
  Heart,
  Home,
  Info,
  Leaf,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Repeat,
  Save,
  Scissors,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  Tag,
  Upload,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { type ChangeEvent, useEffect, useState } from "react";
import { Button } from "@/components/shared/Button";
import { siteConfig } from "@/config/site";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ApiClientError } from "@/lib/api/errors";
import { browserApiFetch } from "@/lib/api/browser";
import { DEFAULT_MAP_CENTER } from "@/lib/maps/config";
import { reverseGeocode, searchPlaces } from "@/lib/maps/geocode";
import type { Coordinates } from "@/lib/maps/types";
import type { SafeUser } from "@/types/auth";
import {
  CLIENT_ONBOARDING_SECTION_STEPS,
  type ClientOnboardingStep,
  type ClientOnboardingStepNumber,
  nextStepSlug,
  previousStepSlug,
  stepByNumber,
} from "@/features/client-onboarding/client-onboarding-steps";

// The map (MapLibre GL JS + its own client-only DOM work) has no business
// being in the server-rendered payload or the initial client bundle - see
// the identical dynamic import in components/map/MapPageClient.tsx.
const BraiderMap = dynamic(() => import("@/components/map/BusinessMap"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-label="Loading map"
      className="flex h-full min-h-[300px] w-full items-center justify-center rounded-md border border-[var(--color-border)] bg-[#eef1ea]"
    >
      <div className="size-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-brand)]" />
    </div>
  ),
});

type ClientOnboardingWizardProps = {
  basePath?: string;
  initialStepNumber: ClientOnboardingStepNumber;
  mode?: "production" | "preview";
  user: SafeUser;
};

type CustomerProfileResponse = {
  profile: {
    displayName: string;
    preferredName: string | null;
    preferredLanguage: string;
    timezone: string;
    phoneNumberE164: string | null;
    phoneVerifiedAt: string | null;
    profileCompletedAt: string | null;
  };
};

type PoliciesResponse = {
  policies: Array<{
    id: string;
    policyType: "TERMS_OF_SERVICE" | "PRIVACY_POLICY" | string;
    version: string;
  }>;
};

type Channel = "EMAIL" | "SMS" | "PUSH";

type SaveState = "idle" | "loading" | "saving" | "saved" | "error";

type DraftState = {
  firstName: string;
  lastName: string;
  preferredName: string;
  pronouns: string;
  dateOfBirth: string;
  email: string;
  countryDialCode: "+1" | "+237" | "+234";
  phoneNumber: string;
  bookingContact: "Text message" | "Email" | "In-app only";
  language: "English" | "French" | "Spanish" | "Portuguese" | "Arabic" | "Swahili";
  timezone: string;
  allowProfessionalContact: boolean;
  searchArea: string;
  searchRadius: number;
  useDefaultSearchArea: boolean;
  serviceLocation: "professional" | "mobile" | "either";
  travelPreference: "30" | "15" | "any";
  interests: string[];
  styleTags: string[];
  preferredDays: string[];
  preferredTime: "Morning" | "Afternoon" | "Evening";
  bookingAhead: "1-2 weeks" | "3-4 weeks" | "Any time";
  flexibleTimes: boolean;
  waitlist: boolean;
  budget: "$100-$250" | "$250-$500" | "$500+";
  showDeposit: boolean;
  transparentPricing: boolean;
  notifications: Record<string, Record<Channel, boolean>>;
  optionalConsents: {
    recommendations: boolean;
    marketing: boolean;
    aiPhotoProcessing: boolean;
    analytics: boolean;
  };
  profileVisibility: "initial" | "preferred" | "ask";
  hideExactLocation: boolean;
  acceptedRequiredPrivacy: boolean;
};

const HERO_IMAGE = "/images/home/images/booking-marketplace-lifestyle.png";
const SALON_IMAGE = "/images/home/images/community-salon-clients.png";
const HAIR_IMAGE = "/images/home/images/braiding-appointment-hero.png";
const PRODUCT_IMAGE = "/images/home/images/marketplace-product-still-life.png";
const AI_STYLE_IMAGE = "/images/ai-studio/catalog/knotless-small-midback-front.jpg";
const CURL_STYLE_IMAGE = "/images/ai-studio/catalog/french-small-midback-front.jpg";

const SERVICE_OPTIONS = [
  {
    id: "hair-braiding",
    title: "Hair & Braiding",
    description: "Braids, locs, protective styles and hair care",
    image: HAIR_IMAGE,
    icon: Leaf,
  },
  {
    id: "nails",
    title: "Nails",
    description: "Manicures, extensions and nail art",
    image: CURL_STYLE_IMAGE,
    icon: Hand,
  },
  {
    id: "barbering",
    title: "Barbering",
    description: "Haircuts, grooming and beard care",
    image: SALON_IMAGE,
    icon: Scissors,
  },
  {
    id: "spa-wellness",
    title: "Spa & Wellness",
    description: "Massage, facials and relaxation",
    image: HERO_IMAGE,
    icon: Sparkles,
  },
  {
    id: "children",
    title: "Children's Services",
    description: "Age-appropriate hair, nails and care",
    image: AI_STYLE_IMAGE,
    icon: User,
  },
  {
    id: "mobile-services",
    title: "Mobile Services",
    description: "Professionals who travel to you",
    image: PRODUCT_IMAGE,
    icon: Car,
  },
] as const;

const STYLE_TAGS = [
  "Knotless braids",
  "Protective styles",
  "Natural hair care",
  "Nail art",
  "Silk press",
  "Loc maintenance",
] as const;

const NOTIFICATION_ROWS = [
  { id: "booking-confirmations", label: "Booking confirmations", required: true },
  { id: "appointment-reminders", label: "Appointment reminders", required: true },
  { id: "changes-cancellations", label: "Changes or cancellations", required: true },
  { id: "professional-messages", label: "Messages from professionals", required: true },
  { id: "security-alerts", label: "Account and security alerts", required: true },
  { id: "new-professionals", label: "New professionals near you", required: false },
  { id: "offers", label: "Offers and inspiration", required: false },
  { id: "ai-credits", label: "AI Studio credit updates", required: false },
] as const;

const INITIAL_NOTIFICATIONS: DraftState["notifications"] = {
  "booking-confirmations": { PUSH: true, EMAIL: true, SMS: true },
  "appointment-reminders": { PUSH: true, EMAIL: true, SMS: true },
  "changes-cancellations": { PUSH: true, EMAIL: true, SMS: true },
  "professional-messages": { PUSH: true, EMAIL: false, SMS: true },
  "security-alerts": { PUSH: true, EMAIL: true, SMS: true },
  "new-professionals": { PUSH: true, EMAIL: false, SMS: false },
  offers: { PUSH: false, EMAIL: false, SMS: false },
  "ai-credits": { PUSH: true, EMAIL: true, SMS: false },
};

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function initialDraft(user: SafeUser): DraftState {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    preferredName: user.firstName,
    pronouns: "She / her",
    dateOfBirth: "",
    email: user.email,
    countryDialCode: "+1",
    phoneNumber: "",
    bookingContact: "Text message",
    language: "English",
    timezone: "America/New_York",
    allowProfessionalContact: true,
    searchArea: "Atlanta, Georgia 30311",
    searchRadius: 10,
    useDefaultSearchArea: true,
    serviceLocation: "professional",
    travelPreference: "30",
    interests: ["hair-braiding", "nails", "spa-wellness"],
    styleTags: ["Knotless braids", "Protective styles", "Natural hair care", "Nail art"],
    preferredDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    preferredTime: "Afternoon",
    bookingAhead: "1-2 weeks",
    flexibleTimes: true,
    waitlist: true,
    budget: "$100-$250",
    showDeposit: true,
    transparentPricing: true,
    notifications: INITIAL_NOTIFICATIONS,
    optionalConsents: {
      recommendations: false,
      marketing: false,
      aiPhotoProcessing: false,
      analytics: false,
    },
    profileVisibility: "initial",
    hideExactLocation: true,
    acceptedRequiredPrivacy: true,
  };
}

function fullName(draft: DraftState) {
  return `${draft.firstName} ${draft.lastName}`.trim();
}

function displayInitials(user: SafeUser, draft: DraftState) {
  const source = draft.preferredName || user.firstName || user.email;
  return source.trim().charAt(0).toUpperCase() || "T";
}

function preferredDisplayName(draft: DraftState) {
  const lastInitial = draft.lastName.trim().charAt(0);
  return `${draft.preferredName || draft.firstName}${lastInitial ? ` ${lastInitial}.` : ""}`;
}

function BrandMonogram({
  className = "",
  size = "medium",
  tone = "gold",
}: {
  className?: string;
  size?: "small" | "medium" | "large" | "watermark";
  tone?: "gold" | "light";
}) {
  const sizeClass = {
    small: "text-2xl",
    medium: "text-5xl",
    large: "text-7xl",
    watermark: "text-[11rem]",
  }[size];
  const toneClass = tone === "light" ? "text-[var(--color-gold-light)]" : "text-[var(--color-gold)]";

  return (
    <span
      aria-hidden="true"
      className={`inline-flex select-none items-baseline font-serif leading-none tracking-normal ${sizeClass} ${toneClass} ${className}`}
    >
      TOH
    </span>
  );
}

function toE164(draft: DraftState) {
  const raw = draft.phoneNumber.trim();
  if (!raw) return null;
  if (raw.startsWith("+")) return raw.replace(/[^\d+]/g, "");
  const digits = raw.replace(/\D/g, "");

  if (draft.countryDialCode === "+1") {
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  }

  if (digits.length >= 7) return `${draft.countryDialCode}${digits}`;
  return null;
}

function formatPhoneForDisplay(draft: DraftState) {
  const e164 = toE164(draft);
  if (!e164) return "your mobile number";
  if (draft.countryDialCode !== "+1") return e164;
  const digits = e164.replace(/^\+1/, "");
  if (digits.length !== 10) return e164;
  return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function ClientOnboardingWizard({
  basePath = "/client-onboarding",
  initialStepNumber,
  mode = "production",
  user,
}: ClientOnboardingWizardProps) {
  const router = useRouter();
  const currentStep = initialStepNumber;
  const isPreview = mode === "preview";
  const [draft, setDraft] = useState<DraftState>(() => initialDraft(user));
  const [saveState, setSaveState] = useState<SaveState>(() =>
    isPreview ? "idle" : "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [policies, setPolicies] = useState<PoliciesResponse["policies"]>([]);
  const [phoneCode, setPhoneCode] = useState(["7", "3", "9", "2", "4", "1"]);
  const [phoneStatus, setPhoneStatus] = useState<"idle" | "verifying" | "verified">(
    "idle",
  );

  useEffect(() => {
    if (isPreview) return;

    let cancelled = false;

    Promise.allSettled([
      browserApiFetch<CustomerProfileResponse>("/api/v1/customer/me"),
      browserApiFetch<PoliciesResponse>("/api/v1/customer/policies"),
    ]).then((results) => {
      if (cancelled) return;

      const profileResult = results[0];
      if (profileResult.status === "fulfilled") {
        const { profile } = profileResult.value;
        setDraft((current) => ({
          ...current,
          preferredName: profile.preferredName ?? current.preferredName,
          language: languageFromCode(profile.preferredLanguage),
          timezone: profile.timezone || current.timezone,
          phoneNumber: profile.phoneNumberE164 ?? current.phoneNumber,
        }));
        if (profile.phoneVerifiedAt) setPhoneStatus("verified");
      }

      const policiesResult = results[1];
      if (policiesResult.status === "fulfilled") {
        setPolicies(policiesResult.value.policies);
      }

      setSaveState("idle");
    });

    return () => {
      cancelled = true;
    };
  }, [isPreview]);

  const step = stepByNumber(currentStep);
  const progressLabel = `${currentStep} of 10`;
  const content = (() => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep />;
      case 2:
        return <ProfileStep draft={draft} setDraft={setDraft} user={user} />;
      case 3:
        return <ContactStep draft={draft} setDraft={setDraft} />;
      case 4:
        return (
          <PhoneVerificationStep
            code={phoneCode}
            draft={draft}
            onCodeChange={setPhoneCode}
            onVerify={handleVerifyPhone}
            status={phoneStatus}
          />
        );
      case 5:
        return <LocationStep draft={draft} setDraft={setDraft} />;
      case 6:
        return <ServicesStep draft={draft} setDraft={setDraft} />;
      case 7:
        return <BookingStep draft={draft} setDraft={setDraft} />;
      case 8:
        return <NotificationsStep draft={draft} setDraft={setDraft} />;
      case 9:
        return <PrivacyStep draft={draft} setDraft={setDraft} />;
      case 10:
        return <CompleteStep draft={draft} />;
      default:
        return <WelcomeStep />;
    }
  })();

  function navigateTo(number: ClientOnboardingStepNumber) {
    setError(null);
    const slug = stepByNumber(number).slug;
    router.push(`${basePath}/${slug}`);
  }

  async function persistCurrentStep() {
    if (isPreview) {
      setSaveState("saved");
      setError(null);
      return;
    }

    setSaveState("saving");
    setError(null);
    try {
      if (currentStep === 2 || currentStep === 3 || currentStep === 10) {
        await browserApiFetch("/api/v1/customer/me", {
          method: "PATCH",
          body: {
            displayName: fullName(draft),
            preferredName: draft.preferredName,
            preferredLanguage: languageCode(draft.language),
            timezone: draft.timezone,
            ...(toE164(draft) ? { phoneNumberE164: toE164(draft) } : {}),
          },
        });
      }

      if (currentStep === 8) {
        await Promise.all([
          browserApiFetch("/api/v1/notifications/preferences", {
            method: "PATCH",
            body: {
              category: "MARKETING",
              channel: "EMAIL",
              isEnabled: draft.notifications.offers.EMAIL,
            },
          }),
          browserApiFetch("/api/v1/notifications/preferences", {
            method: "PATCH",
            body: {
              category: "MARKETING",
              channel: "SMS",
              isEnabled: draft.notifications.offers.SMS,
            },
          }),
          browserApiFetch("/api/v1/notifications/preferences", {
            method: "PATCH",
            body: {
              category: "MARKETING",
              channel: "PUSH",
              isEnabled: draft.notifications.offers.PUSH,
            },
          }),
        ]);
      }

      if (currentStep === 9) {
        const acceptedPolicies = policies
          .filter((policy) =>
            ["TERMS_OF_SERVICE", "PRIVACY_POLICY"].includes(policy.policyType),
          )
          .map((policy) =>
            browserApiFetch("/api/v1/customer/policy-acceptances", {
              method: "POST",
              body: { policyVersionId: policy.id, method: "CHECKBOX" },
            }),
          );

        await Promise.all([
          ...acceptedPolicies,
          browserApiFetch("/api/v1/customer/consents", {
            method: "POST",
            body: {
              consentType: "MARKETING_COMMUNICATION",
              decision: draft.optionalConsents.marketing ? "GRANTED" : "WITHDRAWN",
              reason: "Client onboarding communication preferences",
            },
          }),
          browserApiFetch("/api/v1/customer/consents", {
            method: "POST",
            body: {
              consentType: "AI_HAIRSTYLE_PROCESSING",
              decision: draft.optionalConsents.aiPhotoProcessing
                ? "GRANTED"
                : "WITHDRAWN",
              reason: "Client onboarding AI Studio preference",
            },
          }),
        ]);
      }

      setSaveState("saved");
    } catch (caught) {
      setSaveState("error");
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "We could not save this step. Try again.",
      );
      throw caught;
    }
  }

  async function handleContinue() {
    const validation = validateStep(currentStep, draft, phoneStatus);
    if (validation) {
      setError(validation);
      return;
    }

    try {
      await persistCurrentStep();
    } catch {
      return;
    }

    const nextSlug = nextStepSlug(currentStep);
    if (!nextSlug) return;
    navigateTo((currentStep + 1) as ClientOnboardingStepNumber);
  }

  function handleBack() {
    const previousSlug = previousStepSlug(currentStep);
    if (!previousSlug) return;
    navigateTo((currentStep - 1) as ClientOnboardingStepNumber);
  }

  async function handleSaveAndExit() {
    try {
      await persistCurrentStep();
    } catch {
      return;
    }
    router.push(isPreview ? "/for-clients" : "/account");
  }

  function handleVerifyPhone() {
    if (phoneCode.join("").length < 6) {
      setError("Enter the 6-digit code first.");
      return;
    }

    setPhoneStatus("verifying");
    window.setTimeout(() => {
      setPhoneStatus("verified");
      setError(null);
      setSaveState("saved");
    }, 350);
  }

  return (
    <div className="min-h-dvh bg-[var(--color-page)] text-[var(--color-text-primary)]">
      <div className="hidden min-h-dvh lg:grid lg:grid-cols-[430px_minmax(0,1fr)]">
        <DesktopSidebar currentStep={currentStep} saveState={saveState} />
        <section className="flex min-w-0 flex-col">
          <DesktopTopBar
            draft={draft}
            onSaveAndExit={handleSaveAndExit}
            saveState={saveState}
            user={user}
          />
          <main className="flex-1 px-12 py-10 xl:px-16">
            <div className="mx-auto max-w-[1320px]">
              <StepHeading draft={draft} progressLabel={progressLabel} step={step} />
              {content}
              <StatusMessage error={error} saveState={saveState} />
            </div>
          </main>
          <DesktopActionBar
            continueDisabled={currentStep === 4 && phoneStatus !== "verified"}
            currentStep={currentStep}
            onBack={handleBack}
            onContinue={handleContinue}
            onSkip={() => router.push("/for-clients")}
            saveState={saveState}
          />
        </section>
      </div>

      <div className="lg:hidden">
        <MobileTopBar
          currentStep={currentStep}
          draft={draft}
          onSaveAndExit={handleSaveAndExit}
          user={user}
        />
        <main className="mx-auto min-h-[calc(100dvh-84px)] max-w-[980px] px-7 py-8 sm:px-12">
          <MobileProgress currentStep={currentStep} />
          <StepHeading draft={draft} progressLabel={progressLabel} step={step} />
          {content}
          <StatusMessage error={error} saveState={saveState} />
          <MobileActionBar
            continueDisabled={currentStep === 4 && phoneStatus !== "verified"}
            currentStep={currentStep}
            onBack={handleBack}
            onContinue={handleContinue}
            onSkip={() => router.push("/for-clients")}
            saveState={saveState}
          />
        </main>
      </div>
    </div>
  );
}

function DesktopSidebar({
  currentStep,
  saveState,
}: {
  currentStep: ClientOnboardingStepNumber;
  saveState: SaveState;
}) {
  return (
    <aside className="relative overflow-hidden bg-[var(--color-brand-strong)] px-10 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_12%,rgba(201,150,60,0.16),transparent_30%),linear-gradient(180deg,rgba(116,0,32,0.55),rgba(43,9,28,0.76))]" />
      <BrandMonogram className="pointer-events-none absolute bottom-8 left-28 opacity-[0.06]" size="watermark" />
      <div className="relative z-10 flex min-h-full flex-col">
        <Link aria-label={`${siteConfig.name} home`} className="flex items-center gap-4" href="/">
          <BrandMonogram size="large" />
          <span className="font-serif text-3xl text-white">{siteConfig.name}</span>
        </Link>

        <div className="mt-16">
          <h2 className="font-serif text-3xl text-[var(--color-gold-light)]">
            {currentStep === 10 ? "Profile complete" : "Set up your profile"}
          </h2>
          <div className="mt-5 h-0.5 w-[290px] bg-[var(--color-gold)]" />
        </div>

        <nav aria-label="Client onboarding progress" className="mt-8 grid gap-0">
          {CLIENT_ONBOARDING_SECTION_STEPS.map((section, index) => {
            const completed = currentStep > section.endsAt;
            const active = currentStep >= section.startsAt && currentStep <= section.endsAt;
            return (
              <div className="grid grid-cols-[64px_1fr] gap-4" key={section.title}>
                <div className="flex flex-col items-center">
                  <span
                    className={[
                      "grid size-14 place-items-center rounded-full border-2 text-xl font-semibold",
                      completed
                        ? "border-[#d7ef00] text-[#d7ef00]"
                        : active
                          ? "border-[var(--color-gold-light)] text-[var(--color-gold-light)] shadow-[0_0_22px_rgba(244,223,169,0.28)]"
                          : "border-white/55 text-white/75",
                    ].join(" ")}
                  >
                    {completed ? <Check aria-hidden="true" size={26} /> : section.number}
                  </span>
                  {index < CLIENT_ONBOARDING_SECTION_STEPS.length - 1 ? (
                    <span className="h-20 border-l border-dashed border-white/45" />
                  ) : null}
                </div>
                <div className="pt-3">
                  <p className="text-2xl font-semibold text-white">{section.title}</p>
                  <p
                    className={[
                      "mt-1 text-lg",
                      active ? "text-[var(--color-gold-light)]" : "text-white/72",
                    ].join(" ")}
                  >
                    {section.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[var(--color-gold)] pt-8">
          <SavedLine saveState={saveState} />
        </div>
      </div>
    </aside>
  );
}

function DesktopTopBar({
  draft,
  onSaveAndExit,
  saveState,
  user,
}: {
  draft: DraftState;
  onSaveAndExit: () => void;
  saveState: SaveState;
  user: SafeUser;
}) {
  return (
    <header className="flex min-h-24 items-center justify-end gap-8 border-b border-[var(--color-border)] bg-white/78 px-12 backdrop-blur">
      <Button
        className="min-w-44 text-base"
        disabled={saveState === "saving"}
        leadingIcon={<Save aria-hidden="true" size={22} />}
        onClick={onSaveAndExit}
        variant="secondary"
      >
        Save &amp; exit
      </Button>
      <div className="flex items-center gap-4">
        <AvatarBadge draft={draft} size="large" user={user} />
        <span className="text-xl font-medium">{draft.preferredName || user.firstName}</span>
        <ChevronDown aria-hidden="true" size={22} />
      </div>
    </header>
  );
}

function MobileTopBar({
  currentStep,
  draft,
  onSaveAndExit,
  user,
}: {
  currentStep: ClientOnboardingStepNumber;
  draft: DraftState;
  onSaveAndExit: () => void;
  user: SafeUser;
}) {
  return (
    <header className="sticky top-0 z-30 grid min-h-[84px] grid-cols-[58px_minmax(0,1fr)_96px] items-center border-b border-[var(--color-border)] bg-white/92 px-4 backdrop-blur sm:min-h-[92px] sm:grid-cols-[92px_minmax(0,1fr)_120px] sm:px-6">
      <Link aria-label={`${siteConfig.name} home`} className="flex items-center" href="/">
        <BrandMonogram className="shrink-0" size="small" />
      </Link>
      <h1 className="truncate text-center font-serif text-[1.28rem] leading-none text-[var(--color-text-primary)] sm:text-3xl">
        {currentStep === 10 ? "Profile complete" : "Set up your profile"}
      </h1>
      {currentStep === 10 ? (
        <div className="flex items-center justify-end gap-3">
          <AvatarBadge draft={draft} size="small" user={user} />
          <span className="hidden text-lg sm:inline">{draft.preferredName || user.firstName}</span>
        </div>
      ) : (
        <button
          className="justify-self-end whitespace-nowrap text-base font-medium text-[var(--color-brand)] sm:text-xl"
          onClick={onSaveAndExit}
          type="button"
        >
          Save &amp; exit
        </button>
      )}
    </header>
  );
}

function AvatarBadge({
  draft,
  size,
  user,
}: {
  draft: DraftState;
  size: "small" | "large";
  user: SafeUser;
}) {
  const className =
    size === "large"
      ? "size-14 text-lg"
      : "size-16 text-lg";

  return (
    <span
      aria-hidden="true"
      className={`${className} grid shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--color-gold)] bg-[var(--color-brand)] font-semibold text-[var(--color-gold-light)]`}
    >
      {displayInitials(user, draft)}
    </span>
  );
}

function MobileProgress({ currentStep }: { currentStep: ClientOnboardingStepNumber }) {
  return (
    <div className="mb-7">
      <p className="text-2xl font-medium text-[var(--color-copper)]">{currentStep} of 10</p>
      <div className="mt-4 grid grid-cols-4 gap-3" aria-hidden="true">
        {CLIENT_ONBOARDING_SECTION_STEPS.map((section) => {
          const active = currentStep >= section.startsAt && currentStep <= section.endsAt;
          const complete = currentStep > section.endsAt || currentStep === 10;
          return (
            <div className="relative h-3 rounded-full bg-[#ebe5e1]" key={section.title}>
              <span
                className={[
                  "absolute inset-y-0 left-0 rounded-full",
                  complete || active ? "bg-[var(--color-copper)]" : "bg-transparent",
                ].join(" ")}
                style={{
                  width: complete
                    ? "100%"
                    : active
                      ? `${Math.max(35, ((currentStep - section.startsAt + 1) / (section.endsAt - section.startsAt + 1)) * 100)}%`
                      : "0%",
                }}
              />
              {complete && section.endsAt < 10 ? (
                <span className="absolute left-1/2 top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[var(--color-copper)] text-white">
                  <Check aria-hidden="true" size={18} />
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepHeading({
  draft,
  progressLabel,
  step,
}: {
  draft: DraftState;
  progressLabel: string;
  step: ClientOnboardingStep;
}) {
  const heading = stepHeading(step.number, draft);
  return (
    <div className="mb-8">
      <p className="mb-2 text-sm font-semibold uppercase text-[var(--color-copper)] lg:text-base">
        Client onboarding · {progressLabel}
      </p>
      <h2 className="font-serif text-5xl leading-tight text-[var(--color-text-primary)] max-sm:text-[44px]">
        {heading.title}
      </h2>
      {heading.description ? (
        <p className="mt-3 max-w-3xl text-xl leading-8 text-slate-600 lg:text-2xl">
          {heading.description}
        </p>
      ) : null}
    </div>
  );
}

function stepHeading(step: ClientOnboardingStepNumber, draft: DraftState) {
  switch (step) {
    case 1:
      return {
        title: `Welcome to Touch of Heaven, ${draft.preferredName || draft.firstName}`,
        description:
          "Let's personalise your experience so finding and booking the right professional feels effortless.",
      };
    case 2:
      return {
        title: "Tell us a little about you",
        description:
          "This helps professionals recognise you and personalise your experience.",
      };
    case 3:
      return {
        title: "How can we reach you?",
        description:
          "We'll use these details for booking updates, account recovery and important service messages.",
      };
    case 4:
      return {
        title: "Verify your mobile number",
        description: `Enter the 6-digit code sent to ${formatPhoneForDisplay(draft)}.`,
      };
    case 5:
      return {
        title: "Where would you like to book?",
        description:
          "Choose an approximate area. Your exact home address is not required.",
      };
    case 6:
      return {
        title: "What services interest you?",
        description:
          "Select everything you may want to explore. This does not create a booking.",
      };
    case 7:
      return {
        title: "Make booking fit your schedule",
        description:
          "These preferences improve recommendations. You can always choose something different.",
      };
    case 8:
      return {
        title: "Choose how we keep you updated",
        description:
          "Booking and security messages are separated from optional recommendations.",
      };
    case 9:
      return {
        title: "Your privacy, your choices",
        description:
          "Required service permissions are separated clearly from optional personalization.",
      };
    case 10:
      return {
        title: `Your profile is ready, ${draft.preferredName || draft.firstName}`,
        description:
          "Touch of Heaven is now personalised around your services, location and booking preferences.",
      };
  }
}

function WelcomeStep() {
  const cards = [
    {
      icon: ShieldCheck,
      title: "Discover with confidence",
      text: "Find verified beauty and wellness professionals.",
    },
    {
      icon: CalendarDays,
      title: "Book your way",
      text: "Save the services, times and locations that work for you.",
    },
    {
      icon: Settings,
      title: "Stay in control",
      text: "Choose how we contact you and manage your privacy.",
    },
  ];

  return (
    <section className="grid gap-8 2xl:grid-cols-[minmax(0,1.3fr)_500px] 2xl:items-start">
      <div className="order-2 grid gap-4 2xl:order-1">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              className="grid min-h-32 grid-cols-[120px_1fr] items-center gap-6 rounded-md border border-[var(--color-border)] bg-white/88 p-6 shadow-[var(--shadow-subtle)] max-sm:grid-cols-[82px_1fr] max-sm:p-5"
              key={card.title}
            >
              <Icon
                aria-hidden="true"
                className="mx-auto text-[var(--color-copper)]"
                size={64}
                strokeWidth={1.5}
              />
              <div className="min-w-0">
                <h3 className="text-2xl font-semibold">{card.title}</h3>
                <p className="mt-2 text-xl leading-7 text-slate-600 max-sm:text-lg">
                  {card.text}
                </p>
              </div>
            </article>
          );
        })}
        <div className="mt-3 flex items-center gap-4 rounded-md bg-[#f4eee7] px-6 py-5 text-xl text-slate-600">
          <Clock aria-hidden="true" className="text-[var(--color-copper)]" size={30} />
          This takes about 3 minutes.
        </div>
      </div>

      <div className="order-1 overflow-hidden rounded-md border border-[var(--color-border)] bg-white shadow-[var(--shadow-media)] 2xl:order-2">
        <div
          className="relative aspect-[4/3] min-h-72 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})`, backgroundPosition: "58% center" }}
        >
          <Image
            alt="Touch of Heaven client reviewing booking preferences in a salon"
            className="object-cover"
            fill
            priority
            sizes="(min-width: 1536px) 500px, 100vw"
            src={HERO_IMAGE}
            style={{ objectPosition: "58% center" }}
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-4 bg-gradient-to-t from-[var(--color-brand)] via-[rgba(92,39,71,0.82)] to-transparent px-5 pb-6 pt-16 text-white sm:gap-5 sm:px-7 sm:pb-8 sm:pt-20">
            <span className="grid size-14 shrink-0 place-items-center rounded-full border-2 border-[var(--color-gold)] text-[var(--color-gold-light)] sm:size-16">
              <Leaf aria-hidden="true" size={28} />
            </span>
            <p className="min-w-0 text-lg font-medium leading-6 sm:text-xl sm:leading-7">
              Your preferences can be changed anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileStep({
  draft,
  setDraft,
  user,
}: {
  draft: DraftState;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
  user: SafeUser;
}) {
  return (
    <section className="rounded-md border border-[var(--color-border)] bg-white/88 p-8 shadow-[var(--shadow-subtle)] max-sm:border-0 max-sm:bg-transparent max-sm:p-0 max-sm:shadow-none">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="grid content-start justify-items-center gap-4 border-b border-[var(--color-border)] pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
          <AvatarBadge draft={draft} size="large" user={user} />
          <Button
            className="w-full max-w-[260px] text-lg"
            leadingIcon={<Upload aria-hidden="true" size={24} />}
            variant="secondary"
          >
            Upload photo
          </Button>
          <button className="text-lg font-medium text-[var(--color-brand)]" type="button">
            Remove
          </button>
          <p className="text-center text-base text-slate-500">Optional · JPG or PNG, up to 5 MB</p>
          <div className="flex items-start gap-3 border-t border-[var(--color-border)] pt-4 text-center text-base text-slate-600">
            <Lock aria-hidden="true" className="mt-1 text-[var(--color-copper)]" size={20} />
            <span>Your photo is visible only where you choose.</span>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <TextInput
              label="First name"
              onChange={(value) => setDraft((current) => ({ ...current, firstName: value }))}
              value={draft.firstName}
            />
            <TextInput
              label="Last name"
              onChange={(value) => setDraft((current) => ({ ...current, lastName: value }))}
              value={draft.lastName}
            />
          </div>
          <TextInput
            label="Preferred name"
            onChange={(value) => setDraft((current) => ({ ...current, preferredName: value }))}
            value={draft.preferredName}
          />
          <SelectInput
            label="Pronouns (optional)"
            onChange={(value) => setDraft((current) => ({ ...current, pronouns: value }))}
            options={["She / her", "He / him", "They / them", "Prefer not to say"]}
            value={draft.pronouns}
          />
          <IconInput
            help="Used only for services with age requirements"
            icon={CalendarDays}
            label="Date of birth (optional)"
            onChange={(value) => setDraft((current) => ({ ...current, dateOfBirth: value }))}
            placeholder="Month day, year"
            value={draft.dateOfBirth}
          />
          <CheckRow
            checked
            label={`Use ${draft.preferredName || "this name"} as my display name.`}
            onChange={() => undefined}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-5 rounded-md border border-[var(--color-border)] bg-[#fbf7f3] p-5 max-sm:grid max-sm:grid-cols-[64px_minmax(0,1fr)] max-sm:p-4">
        <p className="min-w-64 text-lg font-medium max-sm:col-span-2 max-sm:min-w-0">
          How professionals will see you
        </p>
        <AvatarBadge draft={draft} size="small" user={user} />
        <div className="min-w-0">
          <p className="text-xl font-semibold">{preferredDisplayName(draft)}</p>
          <span className="mt-1 inline-flex rounded-full bg-[#f3e7d6] px-3 py-1 text-sm text-[var(--color-copper)]">
            Client
          </span>
        </div>
      </div>
    </section>
  );
}

function ContactStep({
  draft,
  setDraft,
}: {
  draft: DraftState;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
}) {
  return (
    <section className="grid min-w-0 gap-6 xl:grid-cols-2">
      <Panel title="Primary contact">
        <IconInput
          badge="Verified"
          icon={Mail}
          label="Email address"
          onChange={() => undefined}
          readOnly
          value={draft.email}
        />
        <div className="grid gap-2">
          <span className="text-lg font-medium">Mobile number</span>
          <div className="grid min-w-0 grid-cols-[78px_minmax(0,1fr)] gap-3 sm:grid-cols-[110px_minmax(0,1fr)]">
            <select
              aria-label="Country code"
              className="min-h-14 rounded-md border border-[var(--color-border)] bg-white px-4 text-lg"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  countryDialCode: event.target.value as DraftState["countryDialCode"],
                }))
              }
              value={draft.countryDialCode}
            >
              <option value="+1">+1</option>
              <option value="+237">+237</option>
              <option value="+234">+234</option>
            </select>
            <IconInput
              buttonLabel="Verify"
              icon={Phone}
              label=""
              onChange={(value) => setDraft((current) => ({ ...current, phoneNumber: value }))}
              placeholder="Mobile number"
              value={draft.phoneNumber}
            />
          </div>
        </div>
        <CheckRow
          checked={draft.allowProfessionalContact}
          label="Use mobile number for urgent booking updates"
          onChange={(checked) =>
            setDraft((current) => ({ ...current, allowProfessionalContact: checked }))
          }
        />
        <button className="w-fit text-lg text-[var(--color-brand)] underline" type="button">
          Change email
        </button>
      </Panel>

      <Panel title="Contact preferences">
        <RadioGroup
          label="Preferred booking contact"
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              bookingContact: value as DraftState["bookingContact"],
            }))
          }
          options={["Text message", "Email", "In-app only"]}
          value={draft.bookingContact}
        />
        <SelectInput
          label="Language"
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              language: value as DraftState["language"],
            }))
          }
          options={["English", "French", "Spanish", "Portuguese", "Arabic", "Swahili"]}
          value={draft.language}
        />
        <SelectInput
          label="Time zone"
          onChange={(value) => setDraft((current) => ({ ...current, timezone: value }))}
          options={[
            "America/New_York",
            "America/Chicago",
            "America/Denver",
            "America/Los_Angeles",
            "Africa/Douala",
          ]}
          value={draft.timezone}
        />
        <CheckRow
          checked={draft.allowProfessionalContact}
          label="Allow professionals I book to contact me about my appointment."
          onChange={(checked) =>
            setDraft((current) => ({ ...current, allowProfessionalContact: checked }))
          }
        />
      </Panel>

      <InfoPanel
        icon={ShieldCheck}
        text="Your contact details are never displayed publicly."
        tone="success"
      />
      <InfoPanel
        icon={Info}
        text="Time-sensitive booking changes may use your verified mobile number."
        tone="warning"
      />
    </section>
  );
}

function PhoneVerificationStep({
  code,
  draft,
  onCodeChange,
  onVerify,
  status,
}: {
  code: string[];
  draft: DraftState;
  onCodeChange: (code: string[]) => void;
  onVerify: () => void;
  status: "idle" | "verifying" | "verified";
}) {
  function updateCode(index: number, event: ChangeEvent<HTMLInputElement>) {
    const next = [...code];
    next[index] = event.target.value.replace(/\D/g, "").slice(-1);
    onCodeChange(next);
    if (event.target.value && event.currentTarget.nextElementSibling instanceof HTMLInputElement) {
      event.currentTarget.nextElementSibling.focus();
    }
  }

  return (
    <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-md border border-[var(--color-border)] bg-white/88 p-8 text-center shadow-[var(--shadow-subtle)]">
        <Shield
          aria-hidden="true"
          className="mx-auto text-[var(--color-copper)]"
          size={82}
          strokeWidth={1.5}
        />
        <h3 className="mt-6 text-2xl font-semibold">Enter the 6-digit code</h3>
        <div className="mt-8 grid grid-cols-6 gap-4">
          {code.map((digit, index) => (
            <input
              aria-label={`Verification digit ${index + 1}`}
              className="h-20 rounded-md border border-[var(--color-border)] bg-white text-center text-4xl font-semibold outline-none focus:border-[var(--color-brand)]"
              inputMode="numeric"
              key={index}
              maxLength={1}
              onChange={(event) => updateCode(index, event)}
              value={digit}
            />
          ))}
        </div>
        <Button
          className="mt-6 min-h-14 w-full text-xl"
          disabled={code.join("").length < 6 || status === "verified"}
          leadingIcon={status === "verified" ? <Check aria-hidden="true" size={22} /> : undefined}
          loading={status === "verifying"}
          onClick={onVerify}
        >
          {status === "verified" ? "Number verified" : "Verify number"}
        </Button>
        <p className="mt-5 text-lg text-slate-600">
          Didn&apos;t receive a code?{" "}
          <span className="font-medium text-[var(--color-brand)]">Resend in 00:42</span>
        </p>
        <div className="my-7 flex items-center gap-6 text-slate-500">
          <span className="h-px flex-1 bg-[var(--color-border)]" />
          or
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </div>
        <div className="flex flex-wrap justify-center gap-5 text-lg text-[var(--color-brand)]">
          <button className="underline" type="button">
            Use a different number
          </button>
          <span aria-hidden="true">|</span>
          <button className="underline" type="button">
            Send code by voice call
          </button>
        </div>
        <p className="mt-7 inline-flex items-center gap-2 text-lg text-slate-600">
          <Lock aria-hidden="true" size={20} />
          The code expires in 10 minutes.
        </p>
      </div>

      <div className="grid content-start gap-5">
        <Panel title="Your contact verification">
          <StatusRow checked label="Email verified" />
          <StatusRow
            checked={status === "verified"}
            label="Mobile verification"
            number={status === "verified" ? undefined : 2}
          />
        </Panel>
        <InfoPanel
          icon={ShieldCheck}
          text="A verified number helps protect your bookings and account recovery."
        />
        <p className="sr-only">Verification target: {formatPhoneForDisplay(draft)}</p>
      </div>
    </section>
  );
}

function LocationStep({
  draft,
  setDraft,
}: {
  draft: DraftState;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
}) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const debouncedSearchArea = useDebouncedValue(draft.searchArea, 500);

  // Geocode the typed address as the user pauses typing, so the map below
  // actually reflects what they wrote instead of always sitting on the
  // default center - see lib/maps/geocode.ts.
  useEffect(() => {
    const query = debouncedSearchArea.trim();
    if (query.length < 3) return;

    let cancelled = false;
    searchPlaces(query)
      .then((results) => {
        if (cancelled || results.length === 0) return;
        setCoordinates(results[0].coordinates);
      })
      .catch((error: unknown) => {
        console.error("[LocationStep] Place search failed.", error);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearchArea]);

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setLocateError("Your browser doesn't support location detection.");
      return;
    }

    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoordinates(point);
        reverseGeocode(point)
          .then((label) => {
            if (label) setDraft((current) => ({ ...current, searchArea: label }));
          })
          .catch((error: unknown) => {
            console.error("[LocationStep] Reverse geocode failed.", error);
          })
          .finally(() => setLocating(false));
      },
      () => {
        setLocating(false);
        setLocateError("Couldn't get your location. Check your browser's location permission.");
      },
    );
  }

  return (
    <section className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_520px]">
      <Panel title="Search area">
        <IconInput
          icon={Search}
          label=""
          onChange={(value) => setDraft((current) => ({ ...current, searchArea: value }))}
          value={draft.searchArea}
        />
        <div className="h-[300px] overflow-hidden rounded-md border border-[var(--color-border)]">
          <BraiderMap
            braiders={[]}
            userCoordinates={coordinates ?? DEFAULT_MAP_CENTER}
            focusRequest={coordinates ? { coordinates } : null}
          />
        </div>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <span className="font-serif text-2xl">Search radius</span>
            <span className="text-xl text-slate-600">{draft.searchRadius} miles</span>
          </div>
          <input
            aria-label="Search radius"
            className="accent-[var(--color-brand)]"
            max={30}
            min={2}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                searchRadius: Number(event.target.value),
              }))
            }
            step={1}
            type="range"
            value={draft.searchRadius}
          />
          <div className="flex justify-between text-lg text-slate-600" aria-hidden="true">
            <span>2</span>
            <span>5</span>
            <span>10</span>
            <span>20</span>
            <span>30+</span>
          </div>
        </div>
        <CheckRow
          checked={draft.useDefaultSearchArea}
          label="Use this as my default search area"
          onChange={(checked) =>
            setDraft((current) => ({ ...current, useDefaultSearchArea: checked }))
          }
        />
        <button
          className="w-fit text-lg text-[var(--color-brand)] underline disabled:opacity-60"
          disabled={locating}
          onClick={handleUseCurrentLocation}
          type="button"
        >
          {locating ? "Locating..." : "Use my current location"}
        </button>
        {locateError ? (
          <p className="text-base text-[var(--color-danger)]" role="alert">
            {locateError}
          </p>
        ) : null}
      </Panel>

      <div className="grid gap-6">
        <Panel title="How do you prefer to receive services?">
          <ChoiceRow
            checked={draft.serviceLocation === "professional"}
            icon={Store}
            label="At a professional's location"
            onClick={() => setDraft((current) => ({ ...current, serviceLocation: "professional" }))}
          />
          <ChoiceRow
            checked={draft.serviceLocation === "mobile"}
            icon={Home}
            label="Mobile professional comes to me"
            onClick={() => setDraft((current) => ({ ...current, serviceLocation: "mobile" }))}
          />
          <ChoiceRow
            checked={draft.serviceLocation === "either"}
            icon={Repeat}
            label="Either option"
            onClick={() => setDraft((current) => ({ ...current, serviceLocation: "either" }))}
          />
        </Panel>
        <Panel title="Travel preference">
          <RadioGroup
            label=""
            onChange={(value) =>
              setDraft((current) => ({ ...current, travelPreference: value as DraftState["travelPreference"] }))
            }
            options={[
              { label: "Up to 30 minutes", value: "30" },
              { label: "Up to 15 minutes", value: "15" },
              { label: "Distance doesn't matter", value: "any" },
            ]}
            value={draft.travelPreference}
          />
        </Panel>
        <InfoPanel
          icon={ShieldCheck}
          text="Only your approximate search area is used for discovery. Exact addresses are shared only when required for a confirmed booking."
        />
      </div>
    </section>
  );
}

function ServicesStep({
  draft,
  setDraft,
}: {
  draft: DraftState;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
}) {
  return (
    <section className="grid gap-8">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {SERVICE_OPTIONS.map((service) => {
          const selected = draft.interests.includes(service.id);
          const Icon = service.icon;
          return (
            <button
              aria-pressed={selected}
              className={[
                "relative grid min-h-44 grid-cols-[150px_1fr] gap-5 rounded-md border bg-white/88 p-3 text-left shadow-[var(--shadow-subtle)] transition focus-ring max-sm:grid-cols-[150px_1fr]",
                selected ? "border-[var(--color-brand)]" : "border-[var(--color-border)]",
              ].join(" ")}
              key={service.id}
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  interests: selected
                    ? current.interests.filter((item) => item !== service.id)
                    : [...current.interests, service.id],
                }))
              }
              type="button"
            >
              <span className="relative min-h-36 overflow-hidden rounded-md bg-[var(--color-brand-soft)]">
                <Image
                  alt=""
                  className="object-cover"
                  fill
                  sizes="150px"
                  src={service.image}
                />
              </span>
              <span className="grid content-center gap-2 pr-8">
                <Icon aria-hidden="true" className="text-[var(--color-copper)]" size={42} strokeWidth={1.4} />
                <span className="font-serif text-2xl">{service.title}</span>
                <span className="text-lg leading-7 text-slate-600">{service.description}</span>
              </span>
              <span className="absolute right-5 top-5">
                {selected ? (
                  <span className="grid size-9 place-items-center rounded-full bg-[var(--color-brand)] text-white">
                    <Check aria-hidden="true" size={20} />
                  </span>
                ) : (
                  <Circle aria-hidden="true" className="text-slate-500" size={30} />
                )}
              </span>
            </button>
          );
        })}
      </div>
      <div className="border-t border-[var(--color-border)] pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-serif text-2xl">Styles you may like</h3>
          <p className="text-2xl text-[var(--color-brand)]">
            <strong>{draft.interests.length}</strong> categories selected
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-4">
          {STYLE_TAGS.slice(0, 4).map((tag) => (
            <button
              aria-pressed={draft.styleTags.includes(tag)}
              className={[
                "inline-flex min-h-12 items-center gap-3 rounded-md border px-5 text-lg focus-ring",
                draft.styleTags.includes(tag)
                  ? "border-[var(--color-brand)] bg-[#fff5f5] text-[var(--color-brand)]"
                  : "border-[var(--color-border)] bg-white text-slate-600",
              ].join(" ")}
              key={tag}
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  styleTags: current.styleTags.includes(tag)
                    ? current.styleTags.filter((item) => item !== tag)
                    : [...current.styleTags, tag],
                }))
              }
              type="button"
            >
              {draft.styleTags.includes(tag) ? <Check aria-hidden="true" size={18} /> : <Plus aria-hidden="true" size={18} />}
              {tag}
            </button>
          ))}
          <button
            className="inline-flex min-h-12 items-center gap-3 rounded-md border border-dashed border-slate-400 bg-white px-5 text-lg text-slate-600 focus-ring"
            type="button"
          >
            <Plus aria-hidden="true" size={20} />
            Add interest
          </button>
        </div>
      </div>
    </section>
  );
}

function BookingStep({
  draft,
  setDraft,
}: {
  draft: DraftState;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
}) {
  return (
    <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="grid gap-6 2xl:grid-cols-3">
        <Panel icon={CalendarDays} title="Preferred days">
          <p className="text-base text-slate-600">Select all that usually work.</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {WEEK_DAYS.map((day) => {
              const selected = draft.preferredDays.includes(day);
              return (
                <button
                  aria-pressed={selected}
                  className={[
                    "flex min-h-14 items-center justify-center gap-2 rounded-md border text-lg font-medium focus-ring",
                    selected
                      ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                      : "border-[var(--color-border)] bg-white text-slate-700",
                  ].join(" ")}
                  key={day}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      preferredDays: selected
                        ? current.preferredDays.filter((item) => item !== day)
                        : [...current.preferredDays, day],
                    }))
                  }
                  type="button"
                >
                  {day}
                  {selected ? <Check aria-hidden="true" size={18} /> : <Circle aria-hidden="true" size={18} />}
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel icon={Clock} title="Preferred time">
          <RadioCards
            onChange={(value) =>
              setDraft((current) => ({ ...current, preferredTime: value as DraftState["preferredTime"] }))
            }
            options={["Morning · 8 AM-12 PM", "Afternoon · 12-5 PM", "Evening · After 5 PM"]}
            value={`${draft.preferredTime} · ${draft.preferredTime === "Morning" ? "8 AM-12 PM" : draft.preferredTime === "Afternoon" ? "12-5 PM" : "After 5 PM"}`}
          />
        </Panel>

        <Panel icon={SlidersHorizontal} title="Booking flexibility">
          <SwitchRow
            checked={draft.flexibleTimes}
            label="Show nearby times when my first choice is unavailable"
            onChange={(checked) => setDraft((current) => ({ ...current, flexibleTimes: checked }))}
          />
          <CheckRow
            checked={draft.waitlist}
            label="Let me join a professional's waitlist"
            onChange={(checked) => setDraft((current) => ({ ...current, waitlist: checked }))}
          />
          <SelectInput
            label="How far ahead?"
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                bookingAhead: value as DraftState["bookingAhead"],
              }))
            }
            options={["1-2 weeks", "3-4 weeks", "Any time"]}
            value={draft.bookingAhead}
          />
        </Panel>

        <div className="2xl:col-span-3">
          <Panel icon={Tag} title="Price and payment preferences">
            <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr] lg:items-center">
              <SelectInput
                label="Typical service budget (optional)"
                onChange={(value) =>
                  setDraft((current) => ({ ...current, budget: value as DraftState["budget"] }))
                }
                options={["$100-$250", "$250-$500", "$500+"]}
                value={draft.budget}
              />
              <div className="grid gap-4">
                <SwitchRow
                  checked={draft.showDeposit}
                  label="Show deposit amount before I choose a time"
                  onChange={(checked) => setDraft((current) => ({ ...current, showDeposit: checked }))}
                />
                <SwitchRow
                  checked={draft.transparentPricing}
                  label="Prioritise professionals with transparent pricing"
                  onChange={(checked) =>
                    setDraft((current) => ({ ...current, transparentPricing: checked }))
                  }
                />
              </div>
            </div>
            <p className="text-base text-slate-500">Budget only improves search results.</p>
          </Panel>
        </div>
      </div>

      <aside className="rounded-md border border-[var(--color-border)] bg-[#f8f0e9] p-6 text-center shadow-[var(--shadow-subtle)]">
        <CalendarDays
          aria-hidden="true"
          className="mx-auto rounded-full bg-[#f0e0ce] p-4 text-[var(--color-copper)]"
          size={96}
          strokeWidth={1.5}
        />
        <h3 className="mt-6 font-serif text-2xl text-[var(--color-brand)]">
          Your current preference
        </h3>
        <SummaryPreference icon={CalendarDays} text="Monday-Saturday" />
        <SummaryPreference icon={Clock} text="Afternoons" />
        <SummaryPreference icon={CalendarDays} text="1-2 weeks ahead" />
      </aside>
    </section>
  );
}

function NotificationsStep({
  draft,
  setDraft,
}: {
  draft: DraftState;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
}) {
  const requiredRows = NOTIFICATION_ROWS.filter((row) => row.required);
  const optionalRows = NOTIFICATION_ROWS.filter((row) => !row.required);

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid gap-6">
        <NotificationPanel
          rows={requiredRows}
          setDraft={setDraft}
          title="Essential booking updates"
          values={draft.notifications}
        />
        <NotificationPanel
          rows={optionalRows}
          setDraft={setDraft}
          title="Optional updates"
          values={draft.notifications}
        />
      </div>
      <Panel title="Reminder timing">
        <SelectInput
          label="First reminder"
          onChange={() => undefined}
          options={["24 hours before", "48 hours before", "Same day"]}
          value="24 hours before"
        />
        <SelectInput
          label="Second reminder"
          onChange={() => undefined}
          options={["2 hours before", "4 hours before", "None"]}
          value="2 hours before"
        />
        <SwitchRow checked label="Respect quiet hours 9:00 PM-8:00 AM" onChange={() => undefined} />
        <InfoPanel
          icon={Info}
          text="Critical same-day booking changes may still be delivered."
          tone="warning"
        />
      </Panel>
      <p className="inline-flex items-center gap-3 text-lg text-slate-600 xl:col-span-2">
        <Lock aria-hidden="true" size={22} />
        You can change these settings anytime.
      </p>
    </section>
  );
}

function PrivacyStep({
  draft,
  setDraft,
}: {
  draft: DraftState;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <Panel title="Required for booking">
        <LockedRequirement text="Share booking details with the professional I choose" />
        <LockedRequirement text="Use my verified contact details for appointment and security messages" />
        <LockedRequirement text="I understand each booking may have its own cancellation and deposit policy." />
        <p className="pt-3 text-lg leading-7">
          By continuing, you agree to our{" "}
          <Link className="text-[var(--color-brand)] underline" href="/legal/privacy">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link className="text-[var(--color-brand)] underline" href="/legal/terms">
            Booking Protection terms
          </Link>
          .
        </p>
      </Panel>

      <Panel title="Optional choices">
        <SwitchRow
          checked={draft.optionalConsents.recommendations}
          label="Personalise recommendations using my activity"
          onChange={(checked) =>
            setDraft((current) => ({
              ...current,
              optionalConsents: { ...current.optionalConsents, recommendations: checked },
            }))
          }
        />
        <SwitchRow
          checked={draft.optionalConsents.marketing}
          label="Receive offers and beauty inspiration"
          onChange={(checked) =>
            setDraft((current) => ({
              ...current,
              optionalConsents: { ...current.optionalConsents, marketing: checked },
            }))
          }
        />
        <SwitchRow
          checked={draft.optionalConsents.aiPhotoProcessing}
          label="Allow AI Studio photo processing"
          onChange={(checked) =>
            setDraft((current) => ({
              ...current,
              optionalConsents: { ...current.optionalConsents, aiPhotoProcessing: checked },
            }))
          }
          subtext="Separate consent is shown before every generation."
        />
        <SwitchRow
          checked={draft.optionalConsents.analytics}
          label="Help improve Touch of Heaven with anonymous usage analytics"
          onChange={(checked) =>
            setDraft((current) => ({
              ...current,
              optionalConsents: { ...current.optionalConsents, analytics: checked },
            }))
          }
        />
      </Panel>

      <div className="xl:col-span-2">
        <Panel title="Profile visibility">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <RadioGroup
              label=""
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  profileVisibility: value as DraftState["profileVisibility"],
                }))
              }
              options={[
                { label: "Show first name and last initial to booked professionals", value: "initial" },
                { label: "Show preferred name only", value: "preferred" },
                { label: "Ask me each time", value: "ask" },
              ]}
              value={draft.profileVisibility}
            />
            <SwitchRow
              checked={draft.hideExactLocation}
              label="Hide my exact search location"
              onChange={(checked) =>
                setDraft((current) => ({ ...current, hideExactLocation: checked }))
              }
              subtext="Professionals will see your area, not your precise address."
            />
          </div>
        </Panel>
      </div>

      <InfoPanel
        icon={FileText}
        text="Consent records are available in Settings. Optional choices can be withdrawn anytime."
        tone="neutral"
      />
    </section>
  );
}

function CompleteStep({ draft }: { draft: DraftState }) {
  const summary = [
    {
      icon: User,
      title: "Profile",
      lines: [preferredDisplayName(draft), "Email and mobile verified"],
      action: "Edit profile",
    },
    {
      icon: MapPin,
      title: "Discovery",
      lines: [draft.searchArea.replace(/\s+\d{5}$/, ""), `${draft.searchRadius}-mile radius`, "Professional location"],
      action: "Edit discovery",
    },
    {
      icon: Heart,
      title: "Interests",
      lines: SERVICE_OPTIONS.filter((service) => draft.interests.includes(service.id)).map(
        (service) => service.title,
      ),
      action: "Edit interests",
    },
    {
      icon: CalendarDays,
      title: "Bookings",
      lines: ["Monday-Saturday", "Afternoons", "1-2 weeks ahead"],
      action: "Edit preferences",
    },
  ];

  const nextActions = [
    {
      icon: Search,
      title: "Explore professionals",
      text: "Find and connect with verified professionals who match your preferences.",
      href: "/for-clients",
    },
    {
      icon: Sparkles,
      title: "Try AI Studio",
      text: "Choose styles now; photo consent is requested separately.",
      href: "/ai-studio",
    },
    {
      icon: User,
      title: "Manage your profile",
      text: "Update your details, preferences and privacy choices anytime.",
      href: "/account/settings/profile",
    },
  ];

  return (
    <section className="grid gap-7">
      <div className="text-center lg:text-left">
        <span className="mx-auto grid size-36 place-items-center rounded-full border-4 border-[var(--color-gold)] bg-[var(--color-brand)] text-[#d7ef00] shadow-[0_0_30px_rgba(201,150,60,0.45)] lg:mx-0">
          <Check aria-hidden="true" size={78} strokeWidth={1.5} />
        </span>
      </div>

      <div className="rounded-md border border-[var(--color-border)] bg-white/88 p-7 shadow-[var(--shadow-subtle)]">
        <div className="grid gap-7 lg:grid-cols-4">
          {summary.map((item) => {
            const Icon = item.icon;
            return (
              <article className="border-[var(--color-border)] lg:border-r lg:pr-6 last:lg:border-r-0" key={item.title}>
                <Icon aria-hidden="true" className="text-[var(--color-copper)]" size={42} strokeWidth={1.5} />
                <h3 className="mt-4 font-serif text-2xl text-[var(--color-brand)]">{item.title}</h3>
                <div className="mt-3 grid gap-1 text-lg">
                  {item.lines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>
                <button className="mt-5 inline-flex items-center gap-2 text-[var(--color-brand)] underline" type="button">
                  {item.action}
                  <Pencil aria-hidden="true" size={16} />
                </button>
              </article>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 2xl:grid-cols-[1fr_300px]">
        <div className="grid gap-5 xl:grid-cols-3">
          {nextActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                className="group grid min-h-40 grid-cols-[70px_1fr_32px] items-center gap-4 rounded-md border border-[var(--color-border)] bg-white/88 p-5 shadow-[var(--shadow-subtle)] transition hover:border-[var(--color-brand)]"
                href={action.href}
                key={action.title}
              >
                <Icon aria-hidden="true" className="text-[var(--color-copper)]" size={48} strokeWidth={1.4} />
                <span>
                  <span className="block font-serif text-2xl text-[var(--color-brand)]">{action.title}</span>
                  <span className="mt-1 block text-base leading-6 text-slate-600">{action.text}</span>
                </span>
                <ArrowRight aria-hidden="true" className="text-[var(--color-brand)] transition group-hover:translate-x-1" size={26} />
              </Link>
            );
          })}
        </div>
        <Panel title="Your privacy choices">
          <StatusRow checked label="Exact search location hidden" />
          <StatusRow checked label="Optional AI photo processing off" />
          <StatusRow checked label="Marketing updates off" />
          <Link className="mt-4 block text-[var(--color-brand)] underline" href="/account/settings/privacy">
            View consent settings
          </Link>
        </Panel>
      </div>

      <div className="mx-auto grid w-full max-w-4xl gap-4 md:grid-cols-2">
        <Link className="btn-primary min-h-16 text-xl" href="/for-clients">
          Explore Touch of Heaven
        </Link>
        <Link className="btn-secondary min-h-16 text-xl" href="/account/settings/profile">
          Go to my profile
        </Link>
      </div>
      <p className="text-center text-lg text-slate-600">
        <ShieldCheck aria-hidden="true" className="mr-2 inline text-slate-700" size={22} />
        Setup completed today · Saved securely
      </p>
    </section>
  );
}

function DesktopActionBar({
  continueDisabled,
  currentStep,
  onBack,
  onContinue,
  onSkip,
  saveState,
}: {
  continueDisabled: boolean;
  currentStep: ClientOnboardingStepNumber;
  onBack: () => void;
  onContinue: () => void;
  onSkip: () => void;
  saveState: SaveState;
}) {
  if (currentStep === 10) return null;
  return (
    <footer className="flex items-center justify-end gap-7 border-t border-[var(--color-border)] bg-white/78 px-16 py-7 backdrop-blur">
      {currentStep === 1 ? (
        <Button className="min-w-72 text-xl" onClick={onSkip} variant="secondary">
          Do this later
        </Button>
      ) : (
        <Button className="min-w-72 text-xl" onClick={onBack} variant="secondary">
          Back
        </Button>
      )}
      <Button
        className="min-w-80 text-xl"
        disabled={continueDisabled}
        loading={saveState === "saving"}
        onClick={onContinue}
      >
        {continueLabel(currentStep)}
      </Button>
    </footer>
  );
}

function MobileActionBar({
  continueDisabled,
  currentStep,
  onBack,
  onContinue,
  onSkip,
  saveState,
}: {
  continueDisabled: boolean;
  currentStep: ClientOnboardingStepNumber;
  onBack: () => void;
  onContinue: () => void;
  onSkip: () => void;
  saveState: SaveState;
}) {
  if (currentStep === 10) return null;
  return (
    <footer className="mt-9 border-t border-[var(--color-border)] pt-6">
      <div className="grid grid-cols-2 gap-5">
        {currentStep === 1 ? (
          <Button className="min-h-16 text-xl" onClick={onSkip} variant="secondary">
            Do this later
          </Button>
        ) : (
          <Button className="min-h-16 text-xl" onClick={onBack} variant="secondary">
            Back
          </Button>
        )}
        <Button
          className="min-h-16 text-xl"
          disabled={continueDisabled}
          loading={saveState === "saving"}
          onClick={onContinue}
        >
          {continueLabel(currentStep)}
        </Button>
      </div>
      <div className="mt-6 justify-center text-slate-600">
        <SavedLine saveState={saveState} />
      </div>
    </footer>
  );
}

function continueLabel(step: ClientOnboardingStepNumber) {
  if (step === 1) return "Start setup";
  if (step === 4) return "Continue after verification";
  if (step === 9) return "Review setup";
  return "Continue";
}

function validateStep(
  step: ClientOnboardingStepNumber,
  draft: DraftState,
  phoneStatus: "idle" | "verifying" | "verified",
) {
  if (step === 2 && (!draft.firstName.trim() || !draft.lastName.trim())) {
    return "First name and last name are required.";
  }
  if (step === 3 && !toE164(draft)) {
    return "Enter a valid mobile number before continuing to verification.";
  }
  if (step === 4 && phoneStatus !== "verified") {
    return "Verify your mobile number before continuing.";
  }
  if (step === 5 && !draft.searchArea.trim()) {
    return "Enter an approximate search area.";
  }
  if (step === 6 && draft.interests.length === 0) {
    return "Select at least one service interest.";
  }
  if (step === 9 && !draft.acceptedRequiredPrivacy) {
    return "Required booking permissions must be accepted to finish onboarding.";
  }
  return null;
}

function StatusMessage({
  error,
  saveState,
}: {
  error: string | null;
  saveState: SaveState;
}) {
  if (!error && saveState !== "error") return null;
  return (
    <p
      className="mt-6 rounded-md border border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-4 text-sm font-medium text-[var(--color-warning)]"
      role="alert"
    >
      {error ?? "We could not save your changes. Try again."}
    </p>
  );
}

function SavedLine({ saveState }: { saveState: SaveState }) {
  const label =
    saveState === "saving"
      ? "Saving..."
      : saveState === "saved"
        ? "Saved automatically."
        : saveState === "error"
          ? "Save needs attention."
          : "Your progress saves automatically.";

  return (
    <p className="flex items-center gap-3 text-base text-white/82 lg:text-white/82 max-lg:text-slate-600">
      <Cloud aria-hidden="true" className="text-[var(--color-gold-light)] max-lg:text-[var(--color-copper)]" size={28} />
      {label}
    </p>
  );
}

function Panel({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
  title: string;
}) {
  return (
    <section className="min-w-0 rounded-md border border-[var(--color-border)] bg-white/88 p-6 shadow-[var(--shadow-subtle)] max-sm:p-4">
      <div className="mb-5 flex items-start justify-between gap-4">
        <h3 className="font-serif text-2xl text-[var(--color-text-primary)]">{title}</h3>
        {Icon ? (
          <Icon
            aria-hidden="true"
            className="text-[var(--color-copper)]"
            size={32}
            strokeWidth={1.5}
          />
        ) : null}
      </div>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

function TextInput({
  help,
  label,
  onChange,
  placeholder,
  readOnly,
  value,
}: {
  help?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  value: string;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-lg font-medium">
      {label}
      <input
        className="min-h-14 w-full min-w-0 rounded-md border border-[var(--color-border)] bg-white px-4 text-xl font-normal outline-none transition focus:border-[var(--color-brand)]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        value={value}
      />
      {help ? <span className="text-base font-normal text-slate-500">{help}</span> : null}
    </label>
  );
}

function IconInput({
  badge,
  buttonLabel,
  help,
  icon: Icon,
  label,
  onChange,
  placeholder,
  readOnly,
  value,
}: {
  badge?: string;
  buttonLabel?: string;
  help?: string;
  icon: LucideIcon;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  value: string;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-lg font-medium">
      {label ? <span>{label}</span> : null}
      <span className="grid min-h-14 w-full min-w-0 grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-[var(--color-border)] bg-white px-4 text-xl font-normal max-sm:grid-cols-[24px_minmax(0,1fr)] max-sm:gap-x-2 max-sm:gap-y-2 max-sm:px-3 max-sm:text-base">
        <Icon aria-hidden="true" className="shrink-0 text-slate-500" size={24} strokeWidth={1.5} />
        <input
          className="min-w-0 flex-1 bg-transparent outline-none max-sm:text-base"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          value={value}
        />
        {badge ? (
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--color-success-soft)] px-3 py-1 text-base text-[var(--color-success)] max-sm:col-start-2 max-sm:w-fit max-sm:px-2 max-sm:text-sm">
            <Check aria-hidden="true" size={16} />
            {badge}
          </span>
        ) : null}
        {buttonLabel ? (
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#fbf0e6] px-3 py-1 text-base text-[var(--color-copper)] max-sm:col-start-2 max-sm:w-fit max-sm:px-2 max-sm:text-sm">
            <Info aria-hidden="true" size={16} />
            {buttonLabel}
          </span>
        ) : null}
      </span>
      {help ? <span className="text-base font-normal text-slate-500">{help}</span> : null}
    </label>
  );
}

function SelectInput({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-lg font-medium">
      {label ? <span>{label}</span> : null}
      <span className="relative block">
        <select
          className="min-h-14 w-full min-w-0 appearance-none rounded-md border border-[var(--color-border)] bg-white px-4 pr-12 text-xl font-normal outline-none transition focus:border-[var(--color-brand)]"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
          size={24}
        />
      </span>
    </label>
  );
}

function CheckRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-4 text-lg text-slate-700">
      <input
        checked={checked}
        className="size-6 accent-[var(--color-brand)]"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function RadioGroup({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<string | { label: string; value: string }>;
  value: string;
}) {
  return (
    <fieldset className="grid gap-3">
      {label ? <legend className="text-lg font-medium">{label}</legend> : null}
      {options.map((option) => {
        const optionValue = typeof option === "string" ? option : option.value;
        const optionLabel = typeof option === "string" ? option : option.label;
        return (
          <label className="flex items-center gap-4 text-lg" key={optionValue}>
            <input
              checked={value === optionValue || value === optionLabel}
              className="size-6 accent-[var(--color-brand)]"
              name={label || "radio-group"}
              onChange={() => onChange(optionValue)}
              type="radio"
            />
            {optionLabel}
          </label>
        );
      })}
    </fieldset>
  );
}

function RadioCards({
  onChange,
  options,
  value,
}: {
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <div className="grid gap-3">
      {options.map((option) => (
        <button
          aria-pressed={value === option}
          className={[
            "flex min-h-14 items-center gap-4 rounded-md border px-4 text-left text-lg focus-ring",
            value === option
              ? "border-[var(--color-brand)] bg-white text-[var(--color-brand)]"
              : "border-[var(--color-border)] bg-white text-slate-700",
          ].join(" ")}
          key={option}
          onClick={() => onChange(option.split(" · ")[0])}
          type="button"
        >
          {value === option ? <Check aria-hidden="true" size={18} /> : <Circle aria-hidden="true" size={18} />}
          {option}
        </button>
      ))}
    </div>
  );
}

function SwitchRow({
  checked,
  label,
  onChange,
  subtext,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  subtext?: string;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-[var(--color-border)] pb-4 last:border-b-0 last:pb-0">
      <button
        aria-checked={checked}
        className={[
          "mt-1 inline-flex h-8 w-14 shrink-0 items-center rounded-full border px-1 transition focus-ring",
          checked
            ? "border-[var(--color-brand)] bg-[var(--color-brand)]"
            : "border-slate-300 bg-slate-200",
        ].join(" ")}
        onClick={() => onChange(!checked)}
        role="switch"
        type="button"
      >
        <span
          className={[
            "grid size-6 place-items-center rounded-full bg-white text-xs transition",
            checked ? "translate-x-6 text-[var(--color-brand)]" : "translate-x-0 text-slate-500",
          ].join(" ")}
        >
          {checked ? <Check aria-hidden="true" size={14} /> : <X aria-hidden="true" size={14} />}
        </span>
      </button>
      <span className="text-lg">
        {label}
        {subtext ? <span className="mt-1 block text-base text-slate-500">{subtext}</span> : null}
      </span>
    </div>
  );
}

function ChoiceRow({
  checked,
  icon: Icon,
  label,
  onClick,
}: {
  checked: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={checked}
      className={[
        "flex min-h-16 min-w-0 items-center gap-4 rounded-md border px-4 text-left text-lg focus-ring",
        checked
          ? "border-[var(--color-brand)] bg-[#fff5f5] text-[var(--color-brand)]"
          : "border-[var(--color-border)] bg-white text-slate-700",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      {checked ? <Check aria-hidden="true" size={22} /> : <Circle aria-hidden="true" size={22} />}
      <Icon aria-hidden="true" className="text-current" size={32} strokeWidth={1.5} />
      {label}
    </button>
  );
}

function StatusRow({
  checked,
  label,
  number,
}: {
  checked: boolean;
  label: string;
  number?: number;
}) {
  return (
    <div
      className={[
        "flex min-h-14 items-center gap-4 rounded-md border px-4 text-lg",
        checked
          ? "border-[var(--color-success)]/30 bg-[var(--color-success-soft)]/45"
          : "border-[var(--color-copper)] bg-[#fff7ed]",
      ].join(" ")}
    >
      <span
        className={[
          "grid size-8 place-items-center rounded-full text-white",
          checked ? "bg-[var(--color-success)]" : "bg-[var(--color-copper)]",
        ].join(" ")}
      >
        {checked ? <Check aria-hidden="true" size={18} /> : number}
      </span>
      {label}
    </div>
  );
}

function InfoPanel({
  icon: Icon,
  text,
  tone = "neutral",
}: {
  icon: LucideIcon;
  text: string;
  tone?: "neutral" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "border-[var(--color-success)]/30 bg-[var(--color-success-soft)]/35"
      : tone === "warning"
        ? "border-[var(--color-copper)]/60 bg-[var(--color-copper-soft)]/45"
        : "border-[var(--color-border)] bg-white/88";

  return (
    <div className={`flex min-w-0 items-center gap-5 rounded-md border p-5 text-lg leading-7 text-slate-700 shadow-[var(--shadow-subtle)] max-sm:p-4 ${toneClass}`}>
      <Icon aria-hidden="true" className="shrink-0 text-[var(--color-copper)]" size={44} strokeWidth={1.5} />
      {text}
    </div>
  );
}

function NotificationPanel({
  rows,
  setDraft,
  title,
  values,
}: {
  rows: typeof NOTIFICATION_ROWS[number][];
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
  title: string;
  values: DraftState["notifications"];
}) {
  return (
    <section className="min-w-0 rounded-md border border-[var(--color-border)] bg-white/88 p-6 shadow-[var(--shadow-subtle)] max-sm:p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_90px_90px_90px] items-center gap-3 border-b border-[var(--color-border)] pb-4 max-sm:grid-cols-[minmax(0,1fr)_48px_48px_48px] max-sm:gap-2">
        <h3 className="font-serif text-2xl">{title}</h3>
        <span className="text-center text-lg">In-app</span>
        <span className="text-center text-lg">Email</span>
        <span className="text-center text-lg">Text</span>
      </div>
      {rows.map((row) => (
        <div
          className="grid min-h-16 grid-cols-[minmax(0,1fr)_90px_90px_90px] items-center gap-3 border-b border-[var(--color-border)] py-3 last:border-b-0 max-sm:grid-cols-[minmax(0,1fr)_48px_48px_48px] max-sm:gap-2"
          key={row.id}
        >
          <span className="min-w-0 text-lg">{row.label}</span>
          {(["PUSH", "EMAIL", "SMS"] as const).map((channel) => (
            <button
              aria-label={`${row.label} ${channel}`}
              aria-pressed={values[row.id][channel]}
              className={[
                "mx-auto inline-flex h-8 w-14 items-center rounded-full border px-1 transition focus-ring max-sm:w-12",
                values[row.id][channel]
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)]"
                  : "border-slate-300 bg-white",
              ].join(" ")}
              key={channel}
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  notifications: {
                    ...current.notifications,
                    [row.id]: {
                      ...current.notifications[row.id],
                      [channel]: !current.notifications[row.id][channel],
                    },
                  },
                }))
              }
              type="button"
            >
              <span
                className={[
                  "grid size-6 place-items-center rounded-full bg-white transition max-sm:size-5",
                  values[row.id][channel] ? "translate-x-6 max-sm:translate-x-5" : "translate-x-0",
                ].join(" ")}
              >
                {values[row.id][channel] ? <Check aria-hidden="true" size={14} /> : <X aria-hidden="true" size={14} />}
              </span>
            </button>
          ))}
        </div>
      ))}
    </section>
  );
}

function LockedRequirement({ text }: { text: string }) {
  return (
    <div className="grid grid-cols-[36px_1fr_28px] items-start gap-4 border-b border-[var(--color-border)] pb-4 last:border-b-0">
      <span className="grid size-8 place-items-center rounded-full bg-[var(--color-brand)] text-white">
        <Check aria-hidden="true" size={18} />
      </span>
      <span className="text-lg leading-7">{text}</span>
      <Lock aria-hidden="true" size={24} />
    </div>
  );
}

function SummaryPreference({
  icon: Icon,
  text,
}: {
  icon: LucideIcon;
  text: string;
}) {
  return (
    <div className="mt-5 flex items-center gap-4 border-t border-[var(--color-border)] pt-5 text-lg">
      <span className="grid size-12 place-items-center rounded-full bg-[#f3e3cf] text-[var(--color-copper)]">
        <Icon aria-hidden="true" size={26} strokeWidth={1.5} />
      </span>
      {text}
    </div>
  );
}

function languageCode(language: DraftState["language"]) {
  const map: Record<DraftState["language"], string> = {
    English: "en",
    French: "fr",
    Spanish: "es",
    Portuguese: "pt",
    Arabic: "ar",
    Swahili: "sw",
  };
  return map[language];
}

function languageFromCode(code: string): DraftState["language"] {
  if (code.startsWith("fr")) return "French";
  if (code.startsWith("es")) return "Spanish";
  if (code.startsWith("pt")) return "Portuguese";
  if (code.startsWith("ar")) return "Arabic";
  if (code.startsWith("sw")) return "Swahili";
  return "English";
}
