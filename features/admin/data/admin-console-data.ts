import type {
  AdminMetric,
  AdminNavigationItem,
  AdminSectionKey,
} from "@/features/admin/types/admin.types";

export const adminNavigationItems: AdminNavigationItem[] = [
  { key: "overview", label: "Overview", href: "/admin", icon: "LayoutDashboard" },
  { key: "bookings", label: "Bookings", href: "/admin/bookings", icon: "CalendarDays" },
  { key: "braiders", label: "Businesses", href: "/admin/businesses", icon: "UserRoundCheck" },
  { key: "applications", label: "Applications", href: "/admin/applications", icon: "ClipboardList" },
  { key: "clients", label: "Clients", href: "/admin/clients", icon: "UsersRound" },
  { key: "marketplace", label: "Marketplace", href: "/admin/marketplace", icon: "ShoppingCart" },
  { key: "orders", label: "Orders", href: "/admin/orders", icon: "PackageCheck" },
  { key: "products", label: "Products", href: "/admin/products", icon: "PackageSearch" },
  { key: "finance", label: "Payouts & Finance", href: "/admin/payments", icon: "BadgeDollarSign" },
  { key: "marketing", label: "Marketing", href: "/admin/marketing", icon: "Megaphone" },
  { key: "reports", label: "Reports & Analytics", href: "/admin/reports", icon: "BarChart3" },
  { key: "reviews", label: "Reviews", href: "/admin/reviews", icon: "Star" },
  { key: "disputes", label: "Disputes", href: "/admin/disputes", icon: "CircleAlert" },
  { key: "support", label: "Support Tickets", href: "/admin/support", icon: "Headphones" },
  { key: "settings", label: "Settings", href: "/admin/settings", icon: "Settings" },
  { key: "team", label: "Team Management", href: "/admin/team", icon: "Users" },
];

export const adminSectionContent: Record<
  AdminSectionKey,
  { title: string; description: string; eyebrow: string }
> = {
  overview: {
    eyebrow: "Owner console",
    title: "Company Overview",
    description: "Monitor bookings, revenue, approvals, marketplace activity, and platform health.",
  },
  bookings: {
    eyebrow: "Bookings",
    title: "Bookings Management",
    description: "Manage appointments, view schedules, and track booking performance.",
  },
  braiders: {
    eyebrow: "Providers",
    title: "Businesses",
    description: "Manage service businesses, applications, provider compliance, and service readiness.",
  },
  applications: {
    eyebrow: "Review",
    title: "Provider applications",
    description: "People asking to work on Touch of Heaven, and the decision each one is waiting for.",
  },
  clients: {
    eyebrow: "Customers",
    title: "Clients & Customer Relationships",
    description: "Manage client relationships, track engagement, and grow lifetime value.",
  },
  marketplace: {
    eyebrow: "Marketplace",
    title: "Marketplace",
    description: "Monitor performance, grow your marketplace, and empower sellers.",
  },
  orders: {
    eyebrow: "Orders",
    title: "Orders",
    description: "Manage and track customer orders across the platform.",
  },
  products: {
    eyebrow: "Catalog",
    title: "Products",
    description: "Review inventory health, product status, and catalog moderation needs.",
  },
  finance: {
    eyebrow: "Finance",
    title: "Payouts & Finance",
    description: "Track payouts, commissions, refunds, fees, and reconciliation health.",
  },
  marketing: {
    eyebrow: "Growth",
    title: "Marketing",
    description: "Review campaign performance and communication health.",
  },
  reports: {
    eyebrow: "Analytics",
    title: "Reports & Analytics",
    description: "Explore business trends, operations, and performance reporting.",
  },
  reviews: {
    eyebrow: "Trust",
    title: "Reviews",
    description: "Moderate reported reviews and monitor customer sentiment.",
  },
  disputes: {
    eyebrow: "Risk",
    title: "Disputes",
    description: "Track payment, order, booking, and support disputes.",
  },
  support: {
    eyebrow: "Support",
    title: "Support Tickets",
    description: "Coordinate customer and professional support issues.",
  },
  settings: {
    eyebrow: "Company",
    title: "Settings",
    description: "Manage supported company settings and operational preferences.",
  },
  team: {
    eyebrow: "Access",
    title: "Team Management",
    description: "Review administrator access and team operational coverage.",
  },
  policies: {
    eyebrow: "Policy",
    title: "Policy Management",
    description: "Manage policy drafts, versions, publication readiness, and acceptance status.",
  },
  audit: {
    eyebrow: "Security",
    title: "Audit Log",
    description: "Review safe audit events and sensitive administrator actions.",
  },
  system: {
    eyebrow: "Health",
    title: "System Health",
    description: "Review safe operational status for frontend, backend, database, and integrations.",
  },
};

export function resolveAdminSectionKey(segments?: string[]): AdminSectionKey {
  const first = segments?.[0];
  if (!first) return "overview";

  const aliases: Record<string, AdminSectionKey> = {
    applications: "braiders",
    appointments: "bookings",
    bookings: "bookings",
    braiders: "braiders",
    businesses: "braiders",
    clients: "clients",
    customers: "clients",
    marketplace: "marketplace",
    orders: "orders",
    products: "products",
    payments: "finance",
    payouts: "finance",
    finance: "finance",
    "payouts-finance": "finance",
    marketing: "marketing",
    reports: "reports",
    analytics: "reports",
    reviews: "reviews",
    disputes: "disputes",
    support: "support",
    "support-tickets": "support",
    settings: "settings",
    team: "team",
    "team-management": "team",
    policies: "policies",
    audit: "audit",
    system: "system",
  };

  return aliases[first] ?? "overview";
}

// TODO: replace with real API — sample data
// Everything from here down (metrics, table rows, applications, platform
// health, schedule) is invented for the console mockup. The navigation and
// section copy above are real configuration.
export const overviewMetrics: AdminMetric[] = [
  {
    label: "Today's Bookings",
    value: "58",
    detail: "16% vs yesterday",
    trend: "+16%",
    tone: "gold",
    icon: "CalendarDays",
  },
  {
    label: "Platform Revenue",
    value: "$8,462.75",
    detail: "Successful payments before refunds",
    trend: "+23%",
    tone: "purple",
    icon: "BadgeDollarSign",
  },
  {
    label: "Active Businesses",
    value: "162",
    detail: "8 new this week",
    trend: "+8",
    tone: "gold",
    icon: "UserRoundCheck",
  },
  {
    label: "Marketplace Orders",
    value: "34",
    detail: "18% vs yesterday",
    trend: "+18%",
    tone: "purple",
    icon: "ShoppingBag",
  },
  {
    label: "Pending Approvals",
    value: "27",
    detail: "Needs your review",
    tone: "gold",
    icon: "ShieldCheck",
  },
  {
    label: "Support Tickets",
    value: "14",
    detail: "3 urgent",
    tone: "purple",
    icon: "Headphones",
  },
];

export const bookingMetrics: AdminMetric[] = [
  { label: "Total Bookings", value: "134", detail: "+18% vs last 7 days", tone: "gold", icon: "CalendarDays" },
  { label: "Confirmed", value: "92", detail: "68.7% of total", tone: "green", icon: "CircleCheck" },
  { label: "Pending", value: "21", detail: "15.7% of total", tone: "gold", icon: "Clock3" },
  { label: "Cancelled", value: "8", detail: "6.0% of total", tone: "red", icon: "CircleX" },
  { label: "Completed", value: "92", detail: "+22% vs last 7 days", tone: "purple", icon: "BadgeCheck" },
];

export const financeMetrics: AdminMetric[] = [
  { label: "Available Balance", value: "$18,732.45", detail: "+12.6% vs last 7 days", tone: "green", icon: "BadgeDollarSign" },
  { label: "Pending Payouts", value: "$24,810.30", detail: "36 payouts", tone: "gold", icon: "Hourglass" },
  { label: "Completed Payouts", value: "$231,894.22", detail: "+18.4% vs last 7 days", tone: "purple", icon: "BadgeCheck" },
  { label: "Commissions Earned", value: "$14,682.19", detail: "+22.1% vs last 7 days", tone: "purple", icon: "Receipt" },
  { label: "Refunds Issued", value: "$2,346.75", detail: "-8.7% vs last 7 days", tone: "red", icon: "RotateCcw" },
  { label: "Failed Transfers", value: "$1,285.60", detail: "5 failed payouts", tone: "red", icon: "TriangleAlert" },
];

export const marketplaceMetrics: AdminMetric[] = [
  { label: "Gross Merchandise Value", value: "$152,390.45", detail: "+24.6% vs last 7 days", tone: "purple", icon: "ShoppingBag" },
  { label: "Marketplace Sales Today", value: "$18,642.30", detail: "+18.3% vs yesterday", tone: "gold", icon: "ShoppingCart" },
  { label: "Active Sellers", value: "412", detail: "22 new this week", tone: "gold", icon: "UsersRound" },
  { label: "Average Order Value", value: "$65.89", detail: "+11.7% vs last 7 days", tone: "purple", icon: "Tags" },
  { label: "Return Requests", value: "27", detail: "+12.5% vs last 7 days", tone: "gold", icon: "RotateCcw" },
];

export const orderMetrics: AdminMetric[] = [
  { label: "Orders Today", value: "42", detail: "+31% vs yesterday", tone: "gold", icon: "CalendarDays" },
  { label: "Processing", value: "28", detail: "+12%", tone: "purple", icon: "Package" },
  { label: "Shipped", value: "37", detail: "+18%", tone: "gold", icon: "Truck" },
  { label: "Delivered", value: "55", detail: "+24%", tone: "green", icon: "CircleCheck" },
  { label: "Return Requests", value: "6", detail: "-14%", tone: "red", icon: "RotateCcw" },
];

export const braiderMetrics: AdminMetric[] = [
  { label: "Active Businesses", value: "162", detail: "+8 this week", tone: "gold", icon: "UserRoundCheck" },
  { label: "New Applications", value: "27", detail: "+6 this week", tone: "purple", icon: "ClipboardCheck" },
  { label: "Suspended Providers", value: "5", detail: "-1 this week", tone: "gold", icon: "ShieldAlert" },
];

export const clientMetrics: AdminMetric[] = [
  { label: "Total Clients", value: "1,248", detail: "+12% vs last 30 days", tone: "purple", icon: "UsersRound" },
  { label: "Repeat Clients", value: "612", detail: "+18% vs last 30 days", tone: "purple", icon: "UserRoundPlus" },
  { label: "Average Order Value", value: "$126.45", detail: "+9% vs last 30 days", tone: "gold", icon: "BadgeDollarSign" },
  { label: "At-Risk Customers", value: "84", detail: "-6% vs last 30 days", tone: "red", icon: "ShieldAlert" },
];

export const bookingRows = [
  ["Jasmine Brown", "Lashae M.", "Boho Knotless", "Warner Robins", "May 21, 2025 10:00 AM", "4h 30m", "$185.00", "Paid", "Confirmed"],
  ["Tiffany Anderson", "Royalty Hair Co.", "Fulani Braids", "Macon", "May 21, 2025 11:30 AM", "3h 30m", "$150.00", "Paid", "Confirmed"],
  ["Brittany Williams", "Stay By Dee", "Goddess Box Braids", "Centerville", "May 21, 2025 12:00 PM", "5h 00m", "$220.00", "Paid", "Confirmed"],
  ["Alicia Johnson", "Braids By Nia", "Tribal Braids", "Macon", "May 21, 2025 1:00 PM", "4h 00m", "$170.00", "Partial", "Pending"],
  ["Deanna Smith", "Beauty by Kay", "Sew In", "Warner Robins", "May 21, 2025 2:00 PM", "3h 00m", "$165.00", "Paid", "Confirmed"],
  ["Monica Davis", "Knotless Queens", "Knotless Mid-Back", "Macon", "May 21, 2025 3:00 PM", "5h 30m", "$210.00", "Paid", "Confirmed"],
  ["Lisa Thompson", "Touched By Tay", "Passion Twists", "Centerville", "May 21, 2025 4:00 PM", "3h 00m", "$140.00", "Partial", "Pending"],
];

export const braiderRows = [
  ["Jasmine Brown", "#TH-1001", "Box Braids, Knotless", "Warner Robins", "6 yrs", "4.9", "156", "Active"],
  ["Lashae Mitchell", "#TH-1002", "Knotless, Boho, Locs", "Macon", "5 yrs", "4.8", "132", "Active"],
  ["Royalty Hair Co.", "#TH-1003", "Sew Ins, Quick Weaves", "Centerville", "8 yrs", "4.9", "118", "Active"],
  ["Tyesha M.", "#TH-1004", "Box Braids, Fulani", "Byron", "4 yrs", "4.7", "103", "Active"],
  ["Dee's Styles", "#TH-1005", "Locs, Twist, Retwist", "Warner Robins", "7 yrs", "4.8", "97", "Busy"],
  ["Touched By Tay", "#TH-1006", "Braids, Ponytails", "Macon", "3 yrs", "4.9", "118", "Active"],
];

export const clientRows = [
  ["Jasmine Brown", "jasmine.b@email.com", "Atlanta, GA", "18", "24", "$1,842.50", "May 25, 2025", "VIP"],
  ["Lashae Mitchell", "lashae.m@email.com", "Decatur, GA", "12", "16", "$1,236.75", "May 25, 2025", "Active"],
  ["Royalty Hair Co.", "royaltyhair@gmail.com", "Marietta, GA", "22", "35", "$2,985.40", "May 25, 2025", "VIP"],
  ["Tyesha M.", "tyesha.m@email.com", "Stonecrest, GA", "9", "13", "$874.20", "May 25, 2025", "Active"],
  ["Ariel Johnson", "ariel.j@email.com", "Sandy Springs, GA", "7", "10", "$645.30", "May 24, 2025", "Active"],
  ["Nia Thompson", "nia.t@email.com", "College Park, GA", "6", "9", "$538.25", "May 23, 2025", "At Risk"],
];

export const orderRows = [
  ["TOH-250525-001", "Jasmine Brown", "Royalty Hair Co.", "2", "UPS Ground", "Atlanta, GA", "$128.50", "Paid", "Processing"],
  ["TOH-250525-002", "Lashae Mitchell", "Touched By Tay", "3", "USPS Priority", "Miami, FL", "$215.00", "Paid", "Processing"],
  ["TOH-250524-045", "Monique Davis", "Slay By Dee", "2", "UPS Ground", "Charlotte, NC", "$145.00", "Paid", "Delivered"],
  ["TOH-250524-044", "Brianna Clark", "Braids By Nia", "1", "USPS Priority", "Chicago, IL", "$59.99", "Paid", "Delivered"],
  ["TOH-250524-043", "Tyesha M.", "Crowned Styles", "4", "FedEx 2Day", "Dallas, TX", "$310.00", "Refunded", "Returned"],
];

export const financeRows = [
  ["May 25, 2025", "Beauty by Kay", "Payout", "$610.00", "-$6.10", "$603.90", "Bank **** 6789", "Completed"],
  ["May 25, 2025", "Slay By Dee", "Payout", "$125.49", "-$1.25", "$124.24", "Bank **** 4321", "Completed"],
  ["May 24, 2025", "Royalty Hair Co.", "Payout", "$450.00", "-$4.50", "$445.50", "Bank **** 6789", "Completed"],
  ["May 23, 2025", "Queen B Bundles", "Refund", "-$60.00", "$0.00", "-$60.00", "Bank **** 6789", "Completed"],
  ["May 22, 2025", "Passion Twists", "Payout", "$215.60", "-$2.16", "$213.44", "Bank **** 6789", "Failed"],
];

export const actionCenter: Array<[string, string, string, string]> = [
  ["Professional applications", "27 pending reviews", "Review now", "/admin/businesses"],
  ["Failed payout transfer", "$215.60 requires reconciliation", "Open finance", "/admin/payments"],
  ["Return requests", "6 marketplace returns need triage", "Open orders", "/admin/orders"],
  ["Reported reviews", "4 reports awaiting moderation", "Open reviews", "/admin/reviews"],
];

export const pendingApplications = [
  ["Jasmine Brown", "Service Business", "Applied 1 hour ago"],
  ["Lashae Mitchell", "Service Business", "Applied 3 hours ago"],
  ["Royalty Hair Co.", "Seller", "Applied 5 hours ago"],
];

export const liveOperations = [
  ["New booking confirmed", "Box Braids - Medium", "Warner Robins"],
  ["Order shipped", "Queen B Bundles", "Order #TH-59874"],
  ["Booking cancelled", "Passion Twists", "Kathleen"],
  ["AI Preview used", "Client: Tyesha M.", "Style Preview"],
];

export const platformHealth = [
  ["System Status", "All Systems Operational", "green"],
  ["Failed Payouts", "2", "red"],
  ["Open Disputes", "3", "gold"],
  ["Unread Reports", "5", "gold"],
  ["Server Uptime", "99.98%", "green"],
  ["Last Backup", "May 25, 2025 - 2:00 AM", "green"],
];

export const marketplaceCategories = [
  ["Hair Care", "$38,492.20", "28.1%"],
  ["Braiding Hair", "$32,180.50", "22.9%"],
  ["African Fashion", "$24,568.40", "19.4%"],
  ["Beauty Tools", "$18,246.30", "16.7%"],
  ["Accessories", "$10,923.15", "13.2%"],
  ["Groceries", "$8,979.90", "10.1%"],
];

export const scheduleItems = [
  ["10:00 AM", "Jasmine Brown", "Boho Knotless", "4h 30m"],
  ["11:30 AM", "Tiffany Anderson", "Fulani Braids", "3h 30m"],
  ["12:00 PM", "Brittany Williams", "Goddess Box Braids", "5h 00m"],
  ["1:00 PM", "Alicia Johnson", "Tribal Braids", "4h 00m"],
  ["2:00 PM", "Deanna Smith", "Sew In", "3h 00m"],
  ["3:00 PM", "Monica Davis", "Knotless Mid-Back", "5h 30m"],
];
