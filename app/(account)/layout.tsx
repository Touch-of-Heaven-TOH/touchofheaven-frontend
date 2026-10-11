import type { Metadata } from "next";
import { AppShell } from "@/components/app/AppShell";
import { ToastProvider } from "@/components/feedback/ToastProvider";
import { ViewerProvider } from "@/components/providers/ViewerProvider";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <ViewerProvider viewer={user}>
      <ToastProvider>
        <AppShell user={user}>{children}</AppShell>
      </ToastProvider>
    </ViewerProvider>
  );
}
