import Link from "next/link";

export function DiscoverySearch() {
  return (
    <section className="page-container -mt-14 relative z-10">
      <form
        className="surface-panel grid gap-3 p-4 md:grid-cols-[1.2fr_1fr_auto]"
        action="/businesses"
      >
        <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          Location
          <input
            className="min-h-12 rounded-md border border-[var(--color-border)] px-3 text-base"
            name="location"
            placeholder="City, ZIP, or neighborhood"
            type="search"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          Style
          <select
            className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base"
            name="service"
          >
            <option value="">Any braid style</option>
            <option value="knotless">Knotless braids</option>
            <option value="cornrows">Cornrows</option>
            <option value="locs">Loc care</option>
          </select>
        </label>
        <div className="flex items-end">
          <button className="btn-primary w-full" type="submit">
            Search
          </button>
        </div>
      </form>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <Link className="btn-ghost" href="/map">
          Open map
        </Link>
        <Link className="btn-ghost" href="/how-it-works">
          See booking steps
        </Link>
      </div>
    </section>
  );
}
