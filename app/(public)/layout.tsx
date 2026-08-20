import { headers } from "next/headers";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { getCurrentUser } from "@/lib/auth/session";

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, headerList] = await Promise.all([getCurrentUser(), headers()]);
  const currentPath = headerList.get("x-toh-pathname") ?? "/";
  const isStudioApp =
    currentPath === "/ai-studio" || currentPath.startsWith("/ai-studio/");

  return (
    <div className="flex min-h-dvh flex-col">
      {isStudioApp ? null : <PublicHeader user={user} />}
      <main className="flex-1">{children}</main>
      {isStudioApp ? null : <PublicFooter />}
    </div>
  );
}
