import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { getCurrentUser } from "@/lib/auth/session";

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        className="focus-ring fixed left-4 top-4 z-[calc(var(--z-overlay)+1)] -translate-y-16 rounded-md bg-[var(--color-surface)] px-4 py-3 text-sm font-bold text-[var(--color-brand)] shadow-[var(--shadow-soft)] transition focus:translate-y-0"
        href="#main-content"
      >
        Skip to content
      </a>
      <PublicHeader user={user} />
      <main className="flex-1" id="main-content">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
