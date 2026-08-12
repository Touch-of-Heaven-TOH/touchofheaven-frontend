import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative isolate grid min-h-dvh place-items-center overflow-hidden bg-[linear-gradient(135deg,#fffaf7,#efe3ea)] px-6 py-12">
      <div className="absolute inset-0 -z-10 bg-white/35" />
      {children}
    </main>
  );
}
