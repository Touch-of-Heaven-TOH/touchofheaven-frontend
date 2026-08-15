"use client";

import { useEffect, useState } from "react";

type DevicePreview = {
  kind: "iphone" | "samsung";
  name: string;
  screenTitle: string;
  src: string;
};

const devicePreviews: DevicePreview[] = [
  {
    kind: "iphone",
    name: "iPhone 14 Pro Max",
    screenTitle: "Braider discovery with map",
    src: "/preview/discovery",
  },
  {
    kind: "samsung",
    name: "Samsung Galaxy S24",
    screenTitle: "Booking confirmation",
    src: "/preview/booking-confirm",
  },
];

function LoadingScreen({ label }: { label: string }) {
  return (
    <div
      aria-label={`Loading ${label}`}
      className="absolute inset-0 z-10 grid gap-4 bg-white p-5"
      role="status"
    >
      <span className="mt-10 h-8 w-32 animate-pulse rounded-full bg-[var(--color-skeleton)]" />
      <span className="h-48 animate-pulse rounded-md bg-[var(--color-skeleton)]" />
      <span className="h-16 animate-pulse rounded-md bg-[var(--color-skeleton)]" />
      <span className="h-16 animate-pulse rounded-md bg-[var(--color-skeleton)]" />
    </div>
  );
}

function StatusBar({ kind }: { kind: DevicePreview["kind"] }) {
  return (
    <div className="relative z-20 flex h-9 items-center justify-between bg-white/92 px-6 text-[11px] font-bold text-[#111114] backdrop-blur">
      <span>9:41</span>
      {kind === "iphone" ? (
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-[#08080a]"
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-2.5 size-3 -translate-x-1/2 rounded-full bg-[#08080a] ring-2 ring-[#202126]"
        />
      )}
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="h-2 w-3 rounded-[2px] bg-[#111114]" />
        <span className="h-2 w-3 rounded-[2px] bg-[#111114]" />
        <span className="h-2 w-5 rounded-[2px] border border-[#111114]">
          <span className="block h-full w-3 bg-[#111114]" />
        </span>
      </span>
    </div>
  );
}

function DevicePreviewFrame({ device }: { device: DevicePreview }) {
  const [loaded, setLoaded] = useState(false);
  const isIphone = device.kind === "iphone";

  useEffect(() => {
    const fallback = window.setTimeout(() => setLoaded(true), 2200);
    return () => window.clearTimeout(fallback);
  }, [device.src]);

  return (
    <figure className="mx-auto w-full max-w-[330px]">
      <div
        className={[
          "relative mx-auto w-full",
          isIphone ? "aspect-[430/932] max-w-[318px]" : "aspect-[412/915] max-w-[306px]",
        ].join(" ")}
      >
        {isIphone ? (
          <>
            <span
              aria-hidden="true"
              className="absolute -left-1 top-28 h-16 w-1 rounded-l-full bg-[#0b0b0d]"
            />
            <span
              aria-hidden="true"
              className="absolute -left-1 top-48 h-20 w-1 rounded-l-full bg-[#0b0b0d]"
            />
            <span
              aria-hidden="true"
              className="absolute -right-1 top-40 h-24 w-1 rounded-r-full bg-[#0b0b0d]"
            />
          </>
        ) : (
          <>
            <span
              aria-hidden="true"
              className="absolute -left-1 top-36 h-24 w-1 rounded-l-full bg-[#15161a]"
            />
            <span
              aria-hidden="true"
              className="absolute -right-1 top-32 h-20 w-1 rounded-r-full bg-[#15161a]"
            />
          </>
        )}

        <div
          className={[
            "absolute inset-0 bg-[#09090b] shadow-[0_28px_90px_rgba(43,23,36,0.32)]",
            isIphone ? "rounded-[3.35rem] p-[10px]" : "rounded-[2.9rem] p-[8px]",
          ].join(" ")}
        >
          <div
            className={[
              "relative flex h-full flex-col overflow-hidden border border-white/10 bg-white",
              isIphone ? "rounded-[2.85rem]" : "rounded-[2.45rem]",
            ].join(" ")}
          >
            <StatusBar kind={device.kind} />
            <div className="relative min-h-0 flex-1 bg-white">
              {loaded ? null : <LoadingScreen label={device.screenTitle} />}
              <iframe
                className="h-full w-full border-0"
                loading="lazy"
                onLoad={() => setLoaded(true)}
                src={device.src}
                title={`${device.name} ${device.screenTitle} preview`}
              />
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-4 text-center">
        <span className="block text-sm font-bold text-[var(--color-brand-strong)]">
          {device.name}
        </span>
        <span className="mt-1 block text-xs font-semibold text-[var(--color-text-muted)]">
          {device.screenTitle}
        </span>
      </figcaption>
    </figure>
  );
}

export function PlatformPhonePreviewsSection() {
  return (
    <section className="bg-[var(--color-page)] py-10 md:py-14">
      <div className="page-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase text-[var(--color-brand-strong)]">
            Real mobile previews
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-[var(--color-brand-strong)] md:text-5xl">
            Touch of Heaven - beautiful on every device.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)] md:text-base">
            Book braiders, shop African products, and try AI hairstyles from a
            phone-first experience built for iPhone and Samsung screens.
          </p>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-2 md:items-start lg:gap-10">
          {devicePreviews.map((device) => (
            <DevicePreviewFrame device={device} key={device.kind} />
          ))}
        </div>
      </div>
    </section>
  );
}
