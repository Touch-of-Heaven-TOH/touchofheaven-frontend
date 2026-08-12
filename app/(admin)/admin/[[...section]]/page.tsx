import type { Metadata } from "next";
import {
  adminSectionContent,
  renderAdminSection,
  resolveAdminSectionKey,
} from "@/features/admin";

type AdminPageProps = {
  params: Promise<{ section?: string[] }>;
};

export async function generateMetadata({
  params,
}: AdminPageProps): Promise<Metadata> {
  const section = resolveAdminSectionKey((await params).section);
  const content = adminSectionContent[section];
  return {
    title: content.title,
    description: content.description,
    robots: { index: false, follow: false },
  };
}

export default async function AdminPage({ params }: AdminPageProps) {
  const section = resolveAdminSectionKey((await params).section);
  return renderAdminSection(section);
}
