import { headers } from "next/headers";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { ViewerProvider } from "@/components/providers/ViewerProvider";
import { getCurrentUser } from "@/lib/auth/session";

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, headerList] = await Promise.all([getCurrentUser(), headers()]);
  const currentPath = headerList.get("x-toh-pathname") ?? "/";
  const isStudioApp =
    currentPath === "/ai-studio" || currentPath.startsWith("/ai-studio/");
  const isDiscoveryApp =
    currentPath === "/explore" ||
    currentPath.startsWith("/businesses/") ||
    currentPath.startsWith("/book-with/");
  const hidePublicChrome = isStudioApp || isDiscoveryApp;

  return (
    <div className="flex min-h-dvh flex-col">
      {hidePublicChrome ? null : <PublicHeader user={user} />}
      <main className="flex-1">
        {/* Discovery pages draw their own header, which needs the visitor. */}
        <ViewerProvider viewer={user}>{children}</ViewerProvider>
      </main>
      {hidePublicChrome ? null : <PublicFooter />}
    </div>
  );
}
