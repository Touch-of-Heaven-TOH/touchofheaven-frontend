import type { Metadata } from "next";
import { ToastProvider } from "@/components/feedback/ToastProvider";
import { ViewerProvider } from "@/components/providers/ViewerProvider";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * The signed-in client experience. Its chrome (header, mobile bottom
 * navigation, footer) comes from ClientShell, which the public discovery
 * pages already use - so a client moving between home, explore and a
 * profile stays inside one consistent frame.
 *
 * ClientShell reads the visitor from ViewerProvider, so this supplies it.
 * Without it the header would offer "Log in" to someone already signed in.
 */
export default async function ClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  return (
    <ViewerProvider viewer={user}>
      <ToastProvider>{children}</ToastProvider>
    </ViewerProvider>
  );
}
