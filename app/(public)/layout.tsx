import { headers } from "next/headers";
import { AppShell } from "@/components/app/AppShell";
import { ToastProvider } from "@/components/feedback/ToastProvider";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { ViewerProvider } from "@/components/providers/ViewerProvider";
import { getCurrentUser } from "@/lib/auth/session";

/** The customer app's screens, which sit inside the 5-tab shell. */
const APP_PREFIXES = ["/businesses", "/marketplace", "/ai-studio", "/cart", "/checkout", "/explore", "/map"];

function isAppPath(path: string) {
  return path === "/" || APP_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export default async function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, headerList] = await Promise.all([getCurrentUser(), headers()]);
  const currentPath = headerList.get("x-toh-pathname") ?? "/";

  if (isAppPath(currentPath)) {
    return (
      <ViewerProvider viewer={user}>
        <ToastProvider>
          <AppShell user={user}>{children}</AppShell>
        </ToastProvider>
      </ViewerProvider>
    );
  }

  // Marketing and legal pages keep the website header and footer.
  const hideChrome = currentPath.startsWith("/book-with/");
  return (
    <div className="flex min-h-dvh flex-col">
      {hideChrome ? null : <PublicHeader user={user} />}
      <main className="flex-1">
        <ViewerProvider viewer={user}>{children}</ViewerProvider>
      </main>
      {hideChrome ? null : <PublicFooter />}
    </div>
  );
}
