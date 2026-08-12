import type { Metadata } from "next";
import { AddressesManager } from "@/features/account/components/AddressesManager";
import { accountContent } from "@/config/page-content";

const content = accountContent.addresses;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

export default function AccountSettingsAddressesPage() {
  return <AddressesManager />;
}
