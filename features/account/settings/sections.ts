import {
  Bell,
  CreditCard,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  User,
  type LucideIcon,
} from "lucide-react";

export type SettingsSectionKey =
  | "profile"
  | "beauty-profile"
  | "addresses"
  | "payment-methods"
  | "notifications"
  | "security"
  | "privacy"
  | "danger";

export type SettingsSection = {
  key: SettingsSectionKey;
  title: string;
  /** One line about what the section is for, shown on the hub. */
  description: string;
  href: string;
  icon: LucideIcon;
  /** Set for the one section that destroys things. */
  destructive?: boolean;
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    key: "profile",
    title: "Profile",
    description: "Your name, photo, phone number, language and timezone.",
    href: "/account/settings/profile",
    icon: User,
  },
  {
    key: "beauty-profile",
    title: "Beauty profile",
    description: "Hair, scalp and skin details providers use to prepare for your appointment.",
    href: "/account/settings/beauty-profile",
    icon: Sparkles,
  },
  {
    key: "addresses",
    title: "Addresses",
    description: "Where a mobile provider comes to, and where orders are delivered.",
    href: "/account/settings/addresses",
    icon: MapPin,
  },
  {
    key: "payment-methods",
    title: "Payment methods",
    description: "Cards saved for deposits, so you don't type them each time.",
    href: "/account/settings/payment-methods",
    icon: CreditCard,
  },
  {
    key: "notifications",
    title: "Notifications",
    description: "Which appointment and marketing messages reach you, and how.",
    href: "/account/settings/notifications",
    icon: Bell,
  },
  {
    key: "security",
    title: "Security",
    description: "Where you're signed in, and signing out everywhere at once.",
    href: "/account/settings/security",
    icon: ShieldCheck,
  },
  {
    key: "privacy",
    title: "Privacy",
    description: "What you've agreed to, and a copy of your data to download.",
    href: "/account/settings/privacy",
    icon: Lock,
  },
  {
    key: "danger",
    title: "Danger zone",
    description: "Delete your account and everything on it.",
    href: "/account/settings/danger",
    icon: TriangleAlert,
    destructive: true,
  },
];

export function settingsSection(key: SettingsSectionKey): SettingsSection {
  const section = SETTINGS_SECTIONS.find((candidate) => candidate.key === key);
  if (!section) throw new Error(`Unknown settings section: ${key}`);
  return section;
}
