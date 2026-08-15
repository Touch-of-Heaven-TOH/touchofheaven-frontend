const sourceCountries = [
  {
    country: "Cameroon",
    focus: "Hair care, spices, textiles, and market staples",
  },
  {
    country: "Nigeria",
    focus: "Beauty oils, braiding hair, pantry goods, and fashion",
  },
  {
    country: "Ivory Coast",
    focus: "Shea, cocoa, wellness, and gifting essentials",
  },
  {
    country: "Kenya",
    focus: "Artisan goods, wellness products, and accessories",
  },
] as const;

function FlagMark({ country }: { country: (typeof sourceCountries)[number]["country"] }) {
  if (country === "Kenya") {
    return (
      <span
        aria-label="Kenya flag"
        className="relative mx-auto block size-24 overflow-hidden rounded-full border-[6px] border-white shadow-[var(--shadow-subtle)]"
        role="img"
        style={{
          background:
            "linear-gradient(to bottom, #000 0 30%, #fff 30% 35%, #bb0000 35% 65%, #fff 65% 70%, #006600 70% 100%)",
        }}
      >
        <span className="absolute inset-x-[38%] inset-y-[20%] rounded-[50%] border border-white bg-[#bb0000]" />
        <span className="absolute inset-x-[46%] inset-y-[16%] bg-white" />
      </span>
    );
  }

  const backgrounds = {
    Cameroon: "linear-gradient(90deg, #007a5e 0 33.33%, #ce1126 33.33% 66.66%, #fcd116 66.66% 100%)",
    Nigeria: "linear-gradient(90deg, #008753 0 33.33%, #fff 33.33% 66.66%, #008753 66.66% 100%)",
    "Ivory Coast":
      "linear-gradient(90deg, #f77f00 0 33.33%, #fff 33.33% 66.66%, #009e60 66.66% 100%)",
  } as const;

  return (
    <span
      aria-label={`${country} flag`}
      className="relative mx-auto grid size-24 place-items-center overflow-hidden rounded-full border-[6px] border-white shadow-[var(--shadow-subtle)]"
      role="img"
      style={{ background: backgrounds[country] }}
    >
      {country === "Cameroon" ? (
        <span className="text-2xl text-[#fcd116]" aria-hidden="true">
          ★
        </span>
      ) : null}
    </span>
  );
}

export function CountrySourceSection() {
  return (
    <section className="bg-[var(--color-sage-soft)] py-9 md:py-12">
      <div className="page-container">
        <div className="mb-6 text-center">
          <p className="text-sm font-bold uppercase text-[var(--color-brand-strong)]">
            Source countries
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-[var(--color-brand-strong)] md:text-4xl">
            Authentic finds across African markets.
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sourceCountries.map((origin) => (
            <article
              className="rounded-md border border-white/80 bg-white p-5 text-center shadow-[var(--shadow-subtle)]"
              key={origin.country}
            >
              <FlagMark country={origin.country} />
              <h3 className="mt-4 text-base font-bold text-[var(--color-brand-strong)]">
                {origin.country}
              </h3>
              <p className="mx-auto mt-2 max-w-52 text-sm leading-6 text-[var(--color-text-muted)]">
                {origin.focus}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
