export type TohRole = "CUSTOMER" | "BRAIDER" | "ADMIN" | "SELLER";

export type AccountStatus =
  | "PENDING_EMAIL_VERIFICATION"
  | "ACTIVE"
  | "SUSPENDED"
  | "DISABLED"
  | "DELETED";

export type SafeUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerifiedAt: string | null;
  status: AccountStatus;
  roles: TohRole[];
  createdAt: string;
};
