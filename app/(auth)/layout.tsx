import type { Metadata } from "next";
import Image from "next/image";
import { brandAssets } from "@/config/site";

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
      <Image
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[min(72vw,620px)] -translate-x-1/2 -translate-y-1/2 select-none blur-sm opacity-[0.07]"
        height={777}
        priority
        src={brandAssets.logoLockup}
        width={900}
      />
      <div className="absolute inset-0 -z-10 bg-white/35" />
      {children}
    </main>
  );
}
