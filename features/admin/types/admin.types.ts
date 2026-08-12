export type AdminSectionKey =
  | "overview"
  | "bookings"
  | "braiders"
  | "clients"
  | "marketplace"
  | "orders"
  | "products"
  | "finance"
  | "marketing"
  | "reports"
  | "reviews"
  | "disputes"
  | "support"
  | "settings"
  | "team"
  | "policies"
  | "audit"
  | "system";

export type AdminTone =
  | "purple"
  | "gold"
  | "green"
  | "red"
  | "blue"
  | "neutral";

export type AdminNavigationItem = {
  key: AdminSectionKey;
  label: string;
  href: string;
  icon: string;
  badge?: string;
};

export type AdminMetric = {
  label: string;
  value: string;
  detail: string;
  trend?: string;
  tone: AdminTone;
  icon: string;
};

export type AdminTableColumn<TItem> = {
  key: string;
  header: string;
  render: (item: TItem) => React.ReactNode;
  align?: "left" | "right" | "center";
};
