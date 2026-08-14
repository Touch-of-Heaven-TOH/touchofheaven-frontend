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
        className="pointer-events-none absolute left-1/2 top-[48%] -z-10 w-[min(76vw,520px)] -translate-x-1/2 -translate-y-1/2 select-none blur-[1.5px] opacity-[0.12]"
        height={512}
        priority
        src={brandAssets.logoMark}
        width={512}
      />
      <Image
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-8 right-6 -z-10 hidden w-[min(32vw,360px)] select-none blur-sm opacity-[0.055] md:block"
        height={777}
        src={brandAssets.logoLockup}
        width={900}
      />
      <div className="absolute inset-0 -z-10 bg-white/35" />
      {children}
    </main>
  );
}
