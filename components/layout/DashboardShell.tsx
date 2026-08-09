import Link from "next/link";
import type { NavigationItem } from "@/config/navigation";
import type { SafeUser } from "@/types/auth";

export type DashboardShellProps = {
  title: string;
  eyebrow: string;
  user: SafeUser;
  navigation: NavigationItem[];
  tone: "account" | "studio" | "admin" | "booking";
  children: React.ReactNode;
};

const toneClassName: Record<DashboardShellProps["tone"], string> = {
  account: "bg-[var(--color-page)]",
  booking: "bg-[var(--color-page)]",
  studio: "bg-[#f6fbfa]",
  admin: "bg-[#f8f9fb]",
};

export function DashboardShell({
  title,
  eyebrow,
  user,
  navigation,
  tone,
  children,
}: DashboardShellProps) {
  return (
    <div className={`min-h-dvh ${toneClassName[tone]}`}>
      <div className="grid min-h-dvh md:grid-cols-[248px_1fr]">
        <aside className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 md:border-r md:border-b-0">
          <Link
            className="flex items-center gap-3 font-semibold text-[var(--color-text-primary)]"
            href="/"
          >
            <span className="grid size-9 place-items-center rounded-md bg-[var(--color-brand)] text-sm font-bold text-[var(--color-gold-light)]">
              TOH
            </span>
            Touch of Heaven
          </Link>
          <nav className="mt-8 flex gap-2 overflow-x-auto md:grid md:overflow-visible">
            {navigation.map((item) => (
              <Link
                className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0">
          <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex flex-col gap-2 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--color-brand)]">
                  {eyebrow}
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">
                  {title}
                </h1>
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </header>
          <div className="px-5 py-6 md:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
