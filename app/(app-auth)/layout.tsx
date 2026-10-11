import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Customer sign-in and sign-up draw their own full-screen layout. */
export default function AppAuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
