import type { Metadata } from "next";
import { SecuritySessions } from "@/features/account/components/SecuritySessions";
import { accountContent } from "@/config/page-content";

const content = accountContent.security;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

export default function AccountSettingsSecurityPage() {
  return <SecuritySessions />;
}
