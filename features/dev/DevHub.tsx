"use client";

import { ExternalLink, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { brandAssets } from "@/config/site";
import type { CatalogSection, PageStatus } from "@/lib/dev/page-catalog";
import type { PreviewPersona } from "@/lib/dev/preview-access";

const STATUS: Record<PageStatus, { label: string; description: string; className: string }> = {
  connected: { label: "Connected", description: "Real data from the backend", className: "bg-[#e8f4ea] text-[#2e7440]" },
  partial: { label: "Partly connected", description: "Some real data, some missing", className: "bg-[#e6eff9] text-[#2f5e9a]" },
  demo: { label: "Demo data", description: "Looks finished, data is hard-coded", className: "bg-[#fcefdd] text-[#955012]" },
  placeholder: { label: "Placeholder", description: "Description only, nothing to do yet", className: "bg-[#fbe9eb] text-[#9f1631]" },
  soon: { label: "Coming soon", description: "Designed coming-soon page", className: "bg-[#fbeedd] text-[#8f5a1d]" },
  static: { label: "Information", description: "Static content, no data needed", className: "bg-[#f1eeee] text-[#5f5557]" },
  preview: { label: "Design preview", description: "Copy of another page", className: "bg-[#f1eeee] text-[#5f5557]" },
};

const PERSONA_LABEL: Record<PreviewPersona, string> = {
  owner: "business owner",
  customer: "client",
  admin: "admin",
};

const PERSONA_ACCOUNT: Record<PreviewPersona, string> = {
  owner: "amara.owner@touchofheaven.test",
  customer: "nadia.fotso@touchofheaven.test",
  admin: "admin@touchofheaven.test",
};

export function DevHub({ sections, previewAccess }: { sections: CatalogSection[]; previewAccess: boolean }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PageStatus | "all">("all");

  const counts = useMemo(() => {
    const result = { all: 0 } as Record<PageStatus | "all", number>;
    for (const section of sections) {
      for (const page of section.pages) {
        result.all += 1;
        result[page.status] = (result[page.status] ?? 0) + 1;
      }
    }
    return result;
  }, [sections]);

  const needle = query.trim().toLowerCase();
  const visible = sections
    .map((section) => ({
      ...section,
      pages: section.pages.filter(
        (page) =>
          (status === "all" || page.status === status) &&
          (!needle || `${page.label} ${page.path} ${page.note ?? ""}`.toLowerCase().includes(needle)),
      ),
    }))
    .filter((section) => section.pages.length > 0);

  const hrefFor = (path: string, as?: PreviewPersona) =>
    as && previewAccess ? `/dev/preview-sign-in?as=${as}&next=${encodeURIComponent(path)}` : path;

  return (
    <div className="min-h-dvh bg-[#fbf8f6] text-[#1f1a1c]">
      <header className="border-b border-[#eee4e1] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="relative size-9 shrink-0 overflow-hidden rounded-full">
            <Image alt="" src={brandAssets.logoMark} fill sizes="36px" className="object-contain" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">Touch of Heaven · Page hub</p>
            <p className="truncate text-xs text-[#6b5e63]">Development only · every page and how far it is built</p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-5 sm:px-6 sm:py-8">
        <section className="rounded-xl border border-[#eee4e1] bg-white p-4 text-sm sm:p-5">
          {previewAccess ? (
            <p>
              <strong>Open as</strong> buttons sign you in with the demo account for that area, then open the page. Signing in
              switches account, so opening a client page after a Studio page signs you in as the client.
            </p>
          ) : (
            <p>
              Preview sign-in is off, so protected pages ask you to sign in. Use the account shown on each card (password{" "}
              <code className="rounded bg-[#f6f1ef] px-1">StudioDemo-2026!</code>). To turn it on, set{" "}
              <code className="rounded bg-[#f6f1ef] px-1">DEV_PREVIEW_ACCESS=true</code> in Frontend_for_HOF/.env.local.
            </p>
          )}
          <p className="mt-2 text-[#6b5e63]">
            Sign-ins are limited to 20 per 15 minutes from this computer. Emails arrive at{" "}
            <a className="font-medium text-[#7a1024] underline" href="http://localhost:8025" target="_blank" rel="noreferrer">
              localhost:8025
            </a>
            .
          </p>
        </section>

        <div className="grid gap-3">
          <label className="relative block">
            <span className="sr-only">Search pages</span>
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#6b5e63]" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by page name or URL…"
              className="min-h-11 w-full rounded-lg border border-[#eee4e1] bg-white pr-3 pl-9 text-sm outline-none focus:border-[#7a1024] focus:ring-2 focus:ring-[#7a1024]/20"
            />
          </label>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            {(["all", ...Object.keys(STATUS)] as Array<PageStatus | "all">).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={status === key}
                onClick={() => setStatus(key)}
                title={key === "all" ? "Every page" : STATUS[key].description}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm whitespace-nowrap ${
                  status === key
                    ? "border-[#7a1024] bg-[#7a1024] text-white"
                    : "border-[#eee4e1] bg-white text-[#1f1a1c] hover:border-[#7a1024]"
                }`}
              >
                {key === "all" ? "All pages" : STATUS[key].label}
                <span className={`rounded-full px-1.5 text-xs ${status === key ? "bg-white/20" : "bg-[#f6f1ef]"}`}>
                  {counts[key] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#ddd0cc] bg-white p-8 text-center text-sm text-[#6b5e63]">
            No pages match.
          </p>
        ) : (
          visible.map((section) => (
            <section key={section.title} className="grid gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {section.title} <span className="text-sm font-normal text-[#6b5e63]">({section.pages.length})</span>
                </h2>
                <p className="text-sm text-[#6b5e63]">{section.description}</p>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {section.pages.map((page) => (
                  <li key={page.path} className="flex min-w-0 flex-col gap-2 rounded-xl border border-[#eee4e1] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 font-medium">{page.label}</p>
                      <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${STATUS[page.status].className}`}>
                        {STATUS[page.status].label}
                      </span>
                    </div>
                    <p className="font-mono text-xs break-all text-[#6b5e63]">{page.path}</p>
                    {page.note ? <p className="text-xs text-[#6b5e63]">{page.note}</p> : null}
                    {page.as && !previewAccess ? (
                      <p className="text-xs text-[#6b5e63]">Sign in as {PERSONA_ACCOUNT[page.as]}</p>
                    ) : null}
                    <Link
                      href={hrefFor(page.path, page.as)}
                      prefetch={false}
                      className="mt-auto inline-flex min-h-10 w-fit items-center gap-1.5 rounded-lg border border-[#7a1024] px-3 text-sm font-medium text-[#7a1024] hover:bg-[#f7e9eb]"
                    >
                      {page.as && previewAccess ? `Open as ${PERSONA_LABEL[page.as]}` : "Open page"}
                      <ExternalLink aria-hidden="true" className="size-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
