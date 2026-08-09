import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { getCurrentUser } from "@/lib/auth/session";

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader user={user} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
