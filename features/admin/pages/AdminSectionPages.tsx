import Link from "next/link";
import { Download, Filter, Plus } from "lucide-react";
import {
  ActionList,
  AdminButton,
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  ContractNotice,
  DonutSummary,
  MetricGrid,
  PersonCell,
  SafeActionButton,
  StatusBadge,
  TrendChart,
} from "@/features/admin/components/AdminPrimitives";
// TODO: replace with real API — sample data (the metrics and rows below are invented)
import {
  actionCenter,
  adminSectionContent,
  bookingMetrics,
  bookingRows,
  braiderMetrics,
  braiderRows,
  clientMetrics,
  clientRows,
  financeMetrics,
  financeRows,
  liveOperations,
  marketplaceCategories,
  marketplaceMetrics,
  orderMetrics,
  orderRows,
  overviewMetrics,
  pendingApplications,
  platformHealth,
  scheduleItems,
} from "@/features/admin/data/admin-console-data";
import type { AdminSectionKey } from "@/features/admin/types/admin.types";

function Toolbar() {
  return (
    <div className="flex flex-wrap gap-2">
      <AdminButton>
        <Filter aria-hidden="true" size={16} />
        Filters
      </AdminButton>
      <AdminButton>
        <Download aria-hidden="true" size={16} />
        Export
      </AdminButton>
    </div>
  );
}

function PageFrame({
  section,
  actions,
  children,
}: {
  section: AdminSectionKey;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const content = adminSectionContent[section];
  return (
    <>
      <AdminPageHeader
        actions={actions}
        description={content.description}
        eyebrow={content.eyebrow}
        title={content.title}
      />
      {children}
    </>
  );
}

export function AdminOverviewPage() {
  return (
    <PageFrame
      actions={
        <AdminButton href="/admin/bookings" variant="primary">
          Open operations
        </AdminButton>
      }
      section="overview"
    >
      <div className="grid gap-4">
        <MetricGrid metrics={overviewMetrics} />
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_1fr]">
          <AdminPanel title="Bookings & Revenue Trend">
            <TrendChart />
            <div className="mt-3 grid gap-3 rounded-md border border-[var(--color-border)] p-3 text-sm sm:grid-cols-2">
              <p>
                <span className="block text-[var(--color-text-muted)]">Total Bookings</span>
                <strong className="text-xl">312</strong>
              </p>
              <p>
                <span className="block text-[var(--color-text-muted)]">Total Revenue</span>
                <strong className="text-xl">$41,672.30</strong>
              </p>
            </div>
          </AdminPanel>

          <AdminPanel title="Revenue Mix">
            <DonutSummary label="Total Revenue" value="$41,672.30" />
            <Link className="mt-4 inline-flex text-sm font-bold text-[var(--color-brand)]" href="/admin/payments">
              View full financial report
            </Link>
          </AdminPanel>

          <AdminPanel title="Action Center">
            <ActionList items={actionCenter} />
          </AdminPanel>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
          <AdminPanel title="Pending Applications" action={<Link className="text-sm font-bold text-[var(--color-brand)]" href="/admin/businesses">View all</Link>}>
            <div className="grid gap-3">
              {pendingApplications.map(([name, role, detail]) => (
                <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] p-3" key={name}>
                  <PersonCell detail={detail} name={name} />
                  <span className="rounded-md bg-[var(--color-brand-soft)] px-2 py-1 text-xs font-bold text-[var(--color-brand)]">
                    {role}
                  </span>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel title="Live Operations" action={<Link className="text-sm font-bold text-[var(--color-brand)]" href="/admin/reports">View all</Link>}>
            <div className="grid gap-3">
              {liveOperations.map(([event, title, detail]) => (
                <div className="rounded-md border border-[var(--color-border)] p-3" key={event}>
                  <p className="font-bold">{event}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-primary)]">{title}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{detail}</p>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel title="Platform Health" action={<Link className="text-sm font-bold text-[var(--color-brand)]" href="/admin/system">View details</Link>}>
            <dl className="grid gap-3">
              {platformHealth.map(([label, value, tone]) => (
                <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-2 last:border-0 last:pb-0" key={label}>
                  <dt className="text-sm text-[var(--color-text-muted)]">{label}</dt>
                  <dd className={tone === "green" ? "font-bold text-[var(--color-success)]" : tone === "red" ? "font-bold text-[var(--color-danger)]" : "font-bold text-[var(--color-warning)]"}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </AdminPanel>
        </div>
      </div>
    </PageFrame>
  );
}

export function AdminBookingsPage() {
  const columns = [
    { key: "client", header: "Client", render: (row: string[]) => <PersonCell name={row[0]} /> },
    { key: "stylist", header: "Stylist", render: (row: string[]) => row[1] },
    { key: "service", header: "Service / Style", render: (row: string[]) => row[2] },
    { key: "location", header: "Location", render: (row: string[]) => row[3] },
    { key: "date", header: "Date & Time", render: (row: string[]) => row[4] },
    { key: "duration", header: "Duration", render: (row: string[]) => row[5] },
    { key: "price", header: "Price", render: (row: string[]) => row[6], align: "right" as const },
    { key: "deposit", header: "Deposit", render: (row: string[]) => row[7] },
    { key: "status", header: "Status", render: (row: string[]) => <StatusBadge status={row[8]} /> },
  ];

  return (
    <PageFrame
      actions={
        <>
          <AdminButton disabled variant="primary">
            <Plus aria-hidden="true" size={16} />
            New Booking
          </AdminButton>
          <Toolbar />
        </>
      }
      section="bookings"
    >
      <div className="grid gap-4">
        <div className="grid gap-2 rounded-md border border-[var(--color-border)] bg-white p-3 md:grid-cols-4 lg:grid-cols-7">
          {["Mon 19", "Tue 20", "Wed 21", "Thu 22", "Fri 23", "Sat 24", "Sun 25"].map((day, index) => (
            <button
              className={`rounded-md border px-3 py-3 text-sm ${index === 2 ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white" : "border-[var(--color-border)] bg-white"}`}
              key={day}
              type="button"
            >
              <span className="block font-bold">{day}</span>
              <span className="mt-1 block text-xs opacity-80">{[12, 18, 22, 16, 24, 28, 14][index]} bookings</span>
            </button>
          ))}
        </div>
        <MetricGrid metrics={bookingMetrics} />
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <AdminPanel title="Bookings (134)">
            <ContractNotice>
              Appointment aggregates and state actions need an admin appointment endpoint. Sensitive consultation details remain hidden.
            </ContractNotice>
            <div className="mt-4">
              <AdminTable columns={columns} rows={bookingRows} />
            </div>
          </AdminPanel>
          <div className="grid gap-4">
            <AdminPanel title="Appointment Details">
              <PersonCell detail="jasmine.brown@email.com" name="Jasmine Brown" />
              <dl className="mt-4 grid gap-3 text-sm">
                {[
                  ["Service / Style", "Boho Knotless"],
                  ["Location", "Warner Robins Studio"],
                  ["Date & Time", "May 21, 2025 at 10:00 AM"],
                  ["Duration", "4h 30m"],
                  ["Price", "$185.00"],
                ].map(([label, value]) => (
                  <div className="flex justify-between gap-3 border-b border-[var(--color-border)] pb-2" key={label}>
                    <dt className="text-[var(--color-text-muted)]">{label}</dt>
                    <dd className="font-bold">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 grid gap-2">
                <SafeActionButton>Confirm Appointment</SafeActionButton>
                <SafeActionButton>Reschedule</SafeActionButton>
                <SafeActionButton>Cancel Appointment</SafeActionButton>
              </div>
            </AdminPanel>
            <AdminPanel title="Today's Schedule">
              <div className="grid gap-2">
                {scheduleItems.map(([time, client, service, duration]) => (
                  <div className="grid grid-cols-[72px_1fr_auto] gap-2 rounded-md border border-[var(--color-border)] p-3 text-sm" key={`${time}-${client}`}>
                    <strong>{time}</strong>
                    <span>
                      <span className="block font-bold">{client}</span>
                      <span className="block text-xs text-[var(--color-text-muted)]">{service}</span>
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">{duration}</span>
                  </div>
                ))}
              </div>
            </AdminPanel>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}

export function AdminBraidersPage() {
  const columns = [
    { key: "provider", header: "Provider", render: (row: string[]) => <PersonCell detail={row[1]} name={row[0]} /> },
    { key: "specialties", header: "Specialties", render: (row: string[]) => row[2] },
    { key: "area", header: "Service Area", render: (row: string[]) => row[3] },
    { key: "exp", header: "Exp.", render: (row: string[]) => row[4] },
    { key: "rating", header: "Rating", render: (row: string[]) => `Star ${row[5]}` },
    { key: "completed", header: "Completed", render: (row: string[]) => row[6], align: "right" as const },
    { key: "status", header: "Status", render: (row: string[]) => <StatusBadge status={row[7]} /> },
  ];

  return (
    <PageFrame section="braiders">
      <div className="grid gap-4">
        <MetricGrid metrics={braiderMetrics} />
        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <AdminPanel title="All Businesses (162)" action={<Toolbar />}>
            <ContractNotice>
              Approval and suspension buttons stay disabled until transactional professional-review endpoints exist.
            </ContractNotice>
            <div className="mt-4">
              <AdminTable columns={columns} rows={braiderRows} />
            </div>
          </AdminPanel>
          <AdminPanel title="Application Review">
            <PersonCell detail="Applied May 24, 2025 - Warner Robins, GA" name="Nia Collins" />
            <div className="mt-4 grid gap-3">
              <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-page)] p-3">
                <p className="font-bold">ID Verification</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">Pending review. Documents require short-lived authorized URLs.</p>
              </div>
              <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-page)] p-3">
                <p className="font-bold">Onboarding Checklist</p>
                <ul className="mt-2 grid gap-2 text-sm">
                  {["Personal information", "ID verification", "Service & pricing", "Portfolio upload", "Background check"].map((item, index) => (
                    <li className="flex justify-between" key={item}>
                      <span>{item}</span>
                      <StatusBadge status={index < 3 ? "Complete" : "Pending"} />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <SafeActionButton>Approve</SafeActionButton>
                <SafeActionButton>Request Changes</SafeActionButton>
                <SafeActionButton>Reject</SafeActionButton>
              </div>
            </div>
          </AdminPanel>
        </div>
      </div>
    </PageFrame>
  );
}

export function AdminClientsPage() {
  const columns = [
    { key: "client", header: "Client", render: (row: string[]) => <PersonCell detail={row[1]} name={row[0]} /> },
    { key: "city", header: "City", render: (row: string[]) => row[2] },
    { key: "bookings", header: "Bookings", render: (row: string[]) => row[3], align: "right" as const },
    { key: "orders", header: "Orders", render: (row: string[]) => row[4], align: "right" as const },
    { key: "value", header: "Lifetime Value", render: (row: string[]) => row[5], align: "right" as const },
    { key: "activity", header: "Last Activity", render: (row: string[]) => row[6] },
    { key: "status", header: "Status", render: (row: string[]) => <StatusBadge status={row[7]} /> },
  ];

  return (
    <PageFrame actions={<Toolbar />} section="clients">
      <div className="grid gap-4">
        <MetricGrid metrics={clientMetrics} />
        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <AdminPanel title="All Clients">
            <ContractNotice>
              Admin customer endpoints are needed before this can search live customer records or perform sensitive account actions.
            </ContractNotice>
            <div className="mt-4">
              <AdminTable columns={columns} rows={clientRows} />
            </div>
          </AdminPanel>
          <AdminPanel title="Customer Snapshot">
            <PersonCell detail="Since Mar 12, 2024 - Client ID: CLT-10234" name="Jasmine Brown" />
            <div className="mt-4 grid gap-3 text-sm">
              {["Saved addresses", "Preferences", "Allergies & sensitivities", "Consent & permissions", "Recent purchases", "Appointment history"].map((item) => (
                <div className="rounded-md border border-[var(--color-border)] p-3" key={item}>
                  <div className="flex items-center justify-between">
                    <strong>{item}</strong>
                    <span className="text-xs font-bold text-[var(--color-brand)]">View</span>
                  </div>
                  <p className="mt-1 text-[var(--color-text-muted)]">Safe summary only. Private details require explicit authorization.</p>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>
      </div>
    </PageFrame>
  );
}

export function AdminMarketplacePage() {
  return (
    <PageFrame actions={<Toolbar />} section="marketplace">
      <div className="grid gap-4">
        <MetricGrid metrics={marketplaceMetrics} />
        <AdminPanel title="Category Performance">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {marketplaceCategories.map(([name, value, share]) => (
              <article className="rounded-md border border-[var(--color-border)] p-3" key={name}>
                <p className="font-bold">{name}</p>
                <p className="mt-2 text-xl font-semibold">{value}</p>
                <p className="text-sm text-[var(--color-success)]">{share} of GMV</p>
              </article>
            ))}
          </div>
        </AdminPanel>
        <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr_0.8fr]">
          <AdminPanel title="Marketplace Sales Overview">
            <TrendChart />
          </AdminPanel>
          <AdminPanel title="Top Sellers Leaderboard">
            <div className="grid gap-3">
              {["Beauty by Kay", "Slay By Dee", "Touched By Tay", "Braids By Nia", "Crowned Styles"].map((seller, index) => (
                <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] p-3" key={seller}>
                  <PersonCell detail={`${276 - index * 37} orders`} name={seller} />
                  <strong>${[18642, 14582, 11392, 9214, 8773][index].toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </AdminPanel>
          <AdminPanel title="Marketplace Health">
            <ContractNotice>
              Seller approvals and listing moderation require admin commerce endpoints.
            </ContractNotice>
            <div className="mt-4 grid gap-3">
              {["Pending seller approvals", "Flagged listings", "Coupon performance"].map((item) => (
                <div className="rounded-md border border-[var(--color-border)] p-3" key={item}>
                  <p className="font-bold">{item}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">Operational review required.</p>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>
      </div>
    </PageFrame>
  );
}

export function AdminOrdersPage() {
  const columns = [
    { key: "order", header: "Order #", render: (row: string[]) => <strong>{row[0]}</strong> },
    { key: "customer", header: "Customer", render: (row: string[]) => <PersonCell name={row[1]} /> },
    { key: "seller", header: "Seller / Store", render: (row: string[]) => row[2] },
    { key: "items", header: "Items", render: (row: string[]) => row[3], align: "center" as const },
    { key: "method", header: "Shipping", render: (row: string[]) => row[4] },
    { key: "dest", header: "Destination", render: (row: string[]) => row[5] },
    { key: "total", header: "Order Total", render: (row: string[]) => row[6], align: "right" as const },
    { key: "payment", header: "Payment", render: (row: string[]) => <StatusBadge status={row[7]} /> },
    { key: "fulfillment", header: "Fulfillment", render: (row: string[]) => <StatusBadge status={row[8]} /> },
  ];

  return (
    <PageFrame actions={<Toolbar />} section="orders">
      <div className="grid gap-4">
        <MetricGrid metrics={orderMetrics} />
        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <AdminPanel title="Orders">
            <ContractNotice>
              Admin order mutations are disabled until commerce admin endpoints define valid transitions.
            </ContractNotice>
            <div className="mt-4">
              <AdminTable columns={columns} rows={orderRows} />
            </div>
          </AdminPanel>
          <AdminPanel title="Order TOH-250525-002">
            <StatusBadge status="Processing" />
            <div className="mt-4 grid gap-3">
              {["Shipping Address", "Fulfillment Timeline", "Items Purchased", "Payment Details", "Refund History"].map((item) => (
                <div className="rounded-md border border-[var(--color-border)] p-3" key={item}>
                  <p className="font-bold">{item}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">Safe operational summary. Private values redacted.</p>
                </div>
              ))}
              <SafeActionButton>Mark Shipped</SafeActionButton>
            </div>
          </AdminPanel>
        </div>
      </div>
    </PageFrame>
  );
}

export function AdminFinancePage() {
  const columns = [
    { key: "date", header: "Date", render: (row: string[]) => row[0] },
    { key: "entity", header: "Entity", render: (row: string[]) => <PersonCell name={row[1]} /> },
    { key: "type", header: "Type", render: (row: string[]) => <StatusBadge status={row[2]} /> },
    { key: "amount", header: "Amount", render: (row: string[]) => row[3], align: "right" as const },
    { key: "fees", header: "Fees", render: (row: string[]) => row[4], align: "right" as const },
    { key: "net", header: "Net Payout", render: (row: string[]) => row[5], align: "right" as const },
    { key: "method", header: "Method", render: (row: string[]) => row[6] },
    { key: "status", header: "Status", render: (row: string[]) => <StatusBadge status={row[7]} /> },
  ];

  return (
    <PageFrame actions={<Toolbar />} section="finance">
      <div className="grid gap-4">
        <MetricGrid metrics={financeMetrics} />
        <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr_380px]">
          <AdminPanel title="Revenue & Payout Trend">
            <TrendChart variant="finance" />
          </AdminPanel>
          <AdminPanel title="Commissions Breakdown">
            <DonutSummary label="Total Commissions" value="$14,682.19" />
          </AdminPanel>
          <AdminPanel title="Payout Batch Control">
            <ContractNotice>
              Release, hold, reconcile, and export actions require MFA-protected finance endpoints.
            </ContractNotice>
            <div className="mt-4 grid gap-2">
              <SafeActionButton>Release Payout</SafeActionButton>
              <SafeActionButton>Hold Payout</SafeActionButton>
              <SafeActionButton>Reconcile Batch</SafeActionButton>
            </div>
          </AdminPanel>
        </div>
        <AdminPanel title="Transaction Ledger">
          <AdminTable columns={columns} rows={financeRows} />
        </AdminPanel>
      </div>
    </PageFrame>
  );
}

export function AdminPlaceholderPage({ section }: { section: AdminSectionKey }) {
  const content = adminSectionContent[section];
  return (
    <PageFrame section={section}>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <AdminPanel title={`${content.title} Readiness`}>
          <ContractNotice>
            This route is reserved in the owner console. Backend admin endpoints,
            permission rules, loading states, error states, and audit behavior
            need to be implemented before operational actions can become live.
          </ContractNotice>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {["No-store admin data", "Denied-by-default permissions", "MFA for sensitive changes", "Audited domain actions"].map((item) => (
              <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-page)] p-4" key={item}>
                <p className="font-bold">{item}</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Required before this module is production-operational.
                </p>
              </div>
            ))}
          </div>
        </AdminPanel>
        <AdminPanel title="Next Contract">
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            Implement the domain endpoint in the backend, add authorization and
            audit tests, then replace this safe readiness panel with live data.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <AdminButton href="/admin">Back to overview</AdminButton>
            <AdminButton href="/admin/system">System health</AdminButton>
          </div>
        </AdminPanel>
      </div>
    </PageFrame>
  );
}

export function renderAdminSection(section: AdminSectionKey) {
  switch (section) {
    case "overview":
      return <AdminOverviewPage />;
    case "bookings":
      return <AdminBookingsPage />;
    case "braiders":
      return <AdminBraidersPage />;
    case "clients":
      return <AdminClientsPage />;
    case "marketplace":
      return <AdminMarketplacePage />;
    case "orders":
      return <AdminOrdersPage />;
    case "finance":
      return <AdminFinancePage />;
    default:
      return <AdminPlaceholderPage section={section} />;
  }
}
