import Link from "next/link";
import type { ReactNode } from "react";
import {
  BadgeCheck,
  BadgeDollarSign,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock3,
  Eye,
  FileWarning,
  Headphones,
  Hourglass,
  Package,
  PackageCheck,
  Receipt,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Tags,
  TriangleAlert,
  Truck,
  UserRoundCheck,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import type {
  AdminMetric,
  AdminTableColumn,
  AdminTone,
} from "@/features/admin/types/admin.types";

const iconMap = {
  BadgeCheck,
  BadgeDollarSign,
  CalendarDays,
  CircleCheck,
  CircleX,
  Clock3,
  Headphones,
  Hourglass,
  Package,
  PackageCheck,
  Receipt,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Tags,
  TriangleAlert,
  Truck,
  UserRoundCheck,
  UserRoundPlus,
  UsersRound,
} as const;

const toneClassName: Record<AdminTone, string> = {
  purple: "bg-[var(--color-brand)] text-white",
  gold: "bg-[var(--color-gold)] text-[#2b1724]",
  green: "bg-[var(--color-success)] text-white",
  red: "bg-[var(--color-danger)] text-white",
  blue: "bg-[#315a8c] text-white",
  neutral: "bg-[var(--color-surface-strong)] text-[var(--color-brand)]",
};

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-copper)]">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-[var(--color-text-primary)] md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          {description}
        </p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminPanel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-md border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)] ${className}`}>
      {title || action ? (
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
          {title ? (
            <h2 className="font-serif text-xl font-semibold text-[var(--color-text-primary)]">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function AdminButton({
  children,
  href,
  variant = "secondary",
  disabled = false,
}: {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  const className =
    variant === "primary"
      ? "btn-primary"
      : variant === "danger"
        ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--color-danger)] px-4 py-2 text-sm font-bold text-[var(--color-danger)]"
        : "btn-secondary";

  if (disabled || !href) {
    return (
      <button className={`${className} opacity-60`} disabled type="button">
        {children}
      </button>
    );
  }

  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

export function MetricCard({ metric }: { metric: AdminMetric }) {
  const Icon = iconMap[metric.icon as keyof typeof iconMap] ?? CircleAlert;

  return (
    <article className="rounded-md border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-subtle)]">
      <div className="flex items-start gap-3">
        <span className={`grid size-12 shrink-0 place-items-center rounded-full ${toneClassName[metric.tone]}`}>
          <Icon aria-hidden="true" size={22} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {metric.label}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-normal text-[var(--color-text-primary)]">
            {metric.value}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {metric.trend ? (
              <span className={metric.tone === "red" ? "font-bold text-[var(--color-danger)]" : "font-bold text-[var(--color-success)]"}>
                {metric.trend}{" "}
              </span>
            ) : null}
            {metric.detail}
          </p>
        </div>
      </div>
    </article>
  );
}

export function MetricGrid({ metrics }: { metrics: AdminMetric[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} metric={metric} />
      ))}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const className = normalized.includes("confirm") ||
    normalized.includes("active") ||
    normalized.includes("paid") ||
    normalized.includes("complete") ||
    normalized.includes("delivered")
      ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
      : normalized.includes("pending") ||
          normalized.includes("process") ||
          normalized.includes("busy")
        ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
        : normalized.includes("risk") ||
            normalized.includes("refund") ||
            normalized.includes("return") ||
            normalized.includes("fail")
          ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
          : "bg-[var(--color-brand-soft)] text-[var(--color-brand)]";

  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${className}`}>
      {status}
    </span>
  );
}

export function AdminTable<TItem>({
  columns,
  rows,
}: {
  columns: AdminTableColumn<TItem>[];
  rows: TItem[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-bold uppercase text-[var(--color-text-muted)]">
            {columns.map((column) => (
              <th
                className={`border-b border-[var(--color-border)] px-3 py-3 ${column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : ""}`}
                key={column.key}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr className="border-b border-[var(--color-border)]" key={rowIndex}>
              {columns.map((column) => (
                <td
                  className={`border-b border-[var(--color-border)] px-3 py-3 align-middle ${column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : ""}`}
                  key={column.key}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PersonCell({
  name,
  detail,
}: {
  name: string;
  detail?: string;
}) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="flex min-w-[150px] items-center gap-2">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-brand-soft)] text-xs font-bold text-[var(--color-brand)]">
        {initials}
      </span>
      <span>
        <span className="block font-bold text-[var(--color-text-primary)]">
          {name}
        </span>
        {detail ? (
          <span className="block text-xs text-[var(--color-text-muted)]">
            {detail}
          </span>
        ) : null}
      </span>
    </div>
  );
}

export function ContractNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-md border border-[var(--color-sage-soft)] bg-[var(--color-sage-soft)] p-3 text-sm text-[var(--color-text-muted)]">
      <p className="flex items-center gap-2 font-bold text-[var(--color-sage)]">
        <FileWarning aria-hidden="true" size={16} />
        Backend contract pending
      </p>
      <p className="mt-1 leading-5">
        {children ??
          "This section is rendered with safe operational sample data until an authorized admin aggregate endpoint is available."}
      </p>
    </div>
  );
}

export function TrendChart({ variant = "default" }: { variant?: "default" | "finance" }) {
  const stroke = variant === "finance" ? "var(--color-brand)" : "var(--color-brand)";
  const secondary = variant === "finance" ? "var(--color-gold)" : "var(--color-copper)";

  return (
    <div className="h-56 rounded-md bg-[linear-gradient(#f6edf2_1px,transparent_1px),linear-gradient(90deg,#f6edf2_1px,transparent_1px)] bg-[length:100%_25%,16.66%_100%] p-4">
      <svg aria-label="Trend chart" className="h-full w-full" role="img" viewBox="0 0 500 190">
        <polyline
          fill="none"
          points="0,120 70,130 140,92 210,110 280,132 350,72 430,42 500,80"
          stroke={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />
        <polyline
          fill="none"
          points="0,150 70,145 140,118 210,122 280,148 350,100 430,64 500,116"
          stroke={secondary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />
        {[0, 70, 140, 210, 280, 350, 430, 500].map((x, index) => (
          <circle cx={x} cy={[120, 130, 92, 110, 132, 72, 42, 80][index]} fill={stroke} key={x} r="5" />
        ))}
      </svg>
    </div>
  );
}

export function DonutSummary({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-center">
      <div className="relative mx-auto grid size-44 place-items-center rounded-full bg-[conic-gradient(var(--color-brand)_0_61%,var(--color-gold)_61%_83%,var(--color-success)_83%_95%,#e8dce4_95%_100%)]">
        <div className="grid size-28 place-items-center rounded-full bg-white text-center">
          <span>
            <span className="block text-2xl font-semibold">{value}</span>
            <span className="block text-xs text-[var(--color-text-muted)]">
              {label}
            </span>
          </span>
        </div>
      </div>
      <ul className="grid gap-3 text-sm">
        {[
          ["Booking Revenue", "67.7%", "var(--color-brand)"],
          ["Marketplace Revenue", "31.2%", "var(--color-gold)"],
          ["Other Revenue", "1.1%", "var(--color-success)"],
        ].map(([name, amount, color]) => (
          <li className="flex items-center justify-between gap-3" key={name}>
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-full" style={{ backgroundColor: color }} />
              {name}
            </span>
            <strong>{amount}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ActionList({
  items,
}: {
  items: Array<[string, string, string, string]>;
}) {
  return (
    <div className="grid gap-3">
      {items.map(([title, detail, action, href]) => (
        <Link
          className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] p-3 transition hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]"
          href={href}
          key={title}
        >
          <span>
            <span className="block font-bold text-[var(--color-text-primary)]">
              {title}
            </span>
            <span className="block text-sm text-[var(--color-text-muted)]">
              {detail}
            </span>
          </span>
          <span className="text-sm font-bold text-[var(--color-brand)]">
            {action}
          </span>
        </Link>
      ))}
    </div>
  );
}

export function SafeActionButton({ children }: { children: ReactNode }) {
  return (
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-bold text-[var(--color-text-muted)] opacity-70"
      disabled
      title="Backend admin action contract required"
      type="button"
    >
      <Eye aria-hidden="true" size={16} />
      {children}
    </button>
  );
}

