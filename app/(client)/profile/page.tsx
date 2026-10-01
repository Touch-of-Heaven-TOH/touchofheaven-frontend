import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

/**
 * The phone's Profile tab.
 *
 * A client's profile already lives at /account/settings/profile, fully
 * built. A second page showing the same fields would be two places to
 * keep in step, so this sends them to the real one.
 */
export default function ProfilePage() {
  redirect("/account/settings/profile");
}
