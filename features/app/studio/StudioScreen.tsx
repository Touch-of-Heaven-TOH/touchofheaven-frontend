"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Icon, type IconName } from "@/components/app/Icon";
import { Portrait, type LookName } from "@/components/app/art";
import { Price, lowestPrice, productArtFor } from "@/components/app/ui";
import { useToast } from "@/components/feedback/ToastProvider";
import { useViewer } from "@/components/providers/ViewerProvider";
import { useCredits, useProducts } from "@/lib/app/data";

type Category = "hair" | "makeup" | "nails" | "outfits";
type Overrides = Parameters<typeof Portrait>[0]["overrides"];
type StudioOption = { name: string; look: LookName; overrides?: Overrides; find: string; shop?: RegExp };

const CATEGORIES: { key: Category; label: string; icon: IconName; detail: string }[] = [
  { key: "hair", label: "Hair", icon: "hair", detail: "Styles and colour" },
  { key: "makeup", label: "Makeup", icon: "lip", detail: "Looks and shades" },
  { key: "nails", label: "Nails", icon: "nail", detail: "Designs" },
  { key: "outfits", label: "Outfits", icon: "shirt", detail: "Colours and tops" },
];

const OPTIONS: Record<Category, StudioOption[]> = {
  hair: [
    { name: "Knotless braids", look: "braids", find: "/businesses?category=braids", shop: /braid|edge/i },
    { name: "Box braids", look: "box", find: "/businesses?category=braids", shop: /braid|edge/i },
    { name: "Goddess locs", look: "locs", find: "/businesses?category=locs", shop: /loc|scalp/i },
    { name: "Two-strand twists", look: "twists", find: "/businesses?category=twists", shop: /leave|shea/i },
    { name: "Silk press", look: "silk", find: "/businesses?category=silk-press-styling", shop: /heat|leave/i },
    { name: "Bob cut", look: "bob", find: "/businesses?category=silk-press-styling", shop: /heat|comb/i },
    { name: "Afro", look: "afro", find: "/businesses?category=natural-styles", shop: /leave|comb|shea/i },
    { name: "Skin fade", look: "fade", find: "/businesses?filter=barber" },
  ],
  makeup: [
    { name: "Natural glow", look: "bun", overrides: { lip: "#b5555f" }, find: "/businesses?category=makeup", shop: /serum|oil/i },
    { name: "Soft glam", look: "glam", find: "/businesses?category=makeup", shop: /serum|oil/i },
    { name: "Bold red lip", look: "bun", overrides: { lip: "#c8102e" }, find: "/businesses?category=makeup" },
    { name: "Smoky eye", look: "bun", overrides: { lid: "#2b1a33", lip: "#7a3b3b" }, find: "/businesses?category=makeup" },
  ],
  nails: [
    { name: "French tip", look: "bun", find: "/businesses?filter=nails" },
    { name: "Chrome", look: "bun", find: "/businesses?filter=nails" },
    { name: "Ombré", look: "bun", find: "/businesses?filter=nails" },
    { name: "Floral art", look: "bun", find: "/businesses?filter=nails" },
  ],
  outfits: [
    { name: "Ankara wrap", look: "bun", overrides: { top: "#c2410c" }, find: "/businesses" },
    { name: "Plum blazer", look: "bun", overrides: { top: "#5b21b6" }, find: "/businesses" },
    { name: "Emerald silk", look: "bun", overrides: { top: "#047857" }, find: "/businesses" },
    { name: "Classic black", look: "bun", overrides: { top: "#111827" }, find: "/businesses" },
  ],
};

const COLOURS: [string, string][] = [
  ["Natural black", "#1c1020"],
  ["Dark brown", "#3a2116"],
  ["Burgundy", "#6b1a33"],
  ["Honey blonde", "#b9813a"],
  ["Copper", "#a0461f"],
  ["Plum", "#5b21b6"],
];

const MODELS: LookName[] = ["braids", "afro", "fade"];
const STUDIO_BG = { bg1: "#3a1f66", bg2: "#1a0f2e" };

/** Saved looks live on this device until the account-side gallery exists. */
const SAVED_KEY = "toh-saved-looks";
const savedListeners = new Set<() => void>();
function readSaved(): string {
  try {
    return localStorage.getItem(SAVED_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}
function useSavedLooks() {
  const raw = useSyncExternalStore(
    (listener) => {
      savedListeners.add(listener);
      return () => savedListeners.delete(listener);
    },
    readSaved,
    () => "[]",
  );
  const looks = JSON.parse(raw) as string[];
  const save = (name: string) => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify([name, ...looks.filter((item) => item !== name)].slice(0, 30)));
    } catch {
      // Private mode: nothing to keep.
    }
    savedListeners.forEach((listener) => listener());
  };
  return { looks, save };
}

function NailArt({ index }: { index: number }) {
  const colours = [
    ["#f7e4e8", "#fff"],
    ["#c9c9cf", "#8f8f99"],
    ["#ffb3c8", "#7a2fe0"],
    ["#ffe1ea", "#d9507f"],
  ][index % 4]!;
  return (
    <svg viewBox="0 0 100 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="100" height="120" fill="#2a1a45" />
      <path d="M20 120 C18 80 24 50 34 40 L42 40 L44 120Z M46 120 L44 32 L56 32 L58 120Z M60 120 L60 38 L70 38 C76 52 78 80 80 120Z" fill="#8e5634" />
      {[
        [31, 38],
        [44, 30],
        [57, 36],
      ].map(([x, y]) => (
        <g key={x}>
          <rect x={x} y={y} width="12" height="18" rx="6" fill={colours[0]} />
          {index === 0 ? <rect x={x} y={y} width="12" height="5" rx="2.5" fill="#fff" /> : null}
          {index === 1 ? <rect x={x! + 2} y={y! + 2} width="3" height="12" rx="1.5" fill="#fff" opacity=".7" /> : null}
          {index === 2 ? <rect x={x} y={y! + 9} width="12" height="9" rx="3" fill={colours[1]} opacity=".7" /> : null}
          {index === 3 ? <circle cx={x! + 6} cy={y! + 9} r="3" fill={colours[1]} /> : null}
        </g>
      ))}
    </svg>
  );
}

function LookArt({ category, index, model, colour }: { category: Category; index: number; model: number; colour: number | null }) {
  if (category === "nails") return <NailArt index={index} />;
  const option = OPTIONS[category][index]!;
  const base = category === "hair" ? option.look : MODELS[model]!;
  const overrides: Overrides = { ...STUDIO_BG, ...option.overrides };
  if (category === "hair" && colour !== null && option.look !== "fade") overrides.hair = COLOURS[colour]![1];
  return <Portrait look={base} overrides={overrides} />;
}

export function StudioScreen() {
  const params = useSearchParams();
  const viewer = useViewer();
  const toast = useToast();
  const { credits } = useCredits(Boolean(viewer));
  const { products } = useProducts();
  const { looks: saved, save } = useSavedLooks();
  const requested = params.get("look")?.toLowerCase();
  const initial = (() => {
    for (const category of CATEGORIES) {
      const index = OPTIONS[category.key].findIndex((option) => option.name.toLowerCase() === requested);
      if (index >= 0) return { category: category.key, index };
    }
    return { category: "hair" as Category, index: 0 };
  })();
  const [category, setCategory] = useState<Category>(initial.category);
  const [index, setIndex] = useState(initial.index);
  const [model, setModel] = useState(0);
  const [colour, setColour] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ category: Category; index: number; model: number; colour: number | null } | null>(null);

  const options = OPTIONS[category];
  const shown = result ? OPTIONS[result.category][result.index]! : null;
  const shopFor = (shown ?? options[index]!).shop;
  const recommended = (shopFor ? products.filter((product) => shopFor.test(product.name)) : []).concat(products).filter(
    (product, position, all) => all.findIndex((other) => other.id === product.id) === position,
  );

  const tryOn = () => {
    setBusy(true);
    setResult(null);
    window.setTimeout(() => {
      setResult({ category, index, model, colour: category === "hair" ? colour : null });
      setBusy(false);
    }, 1200);
  };

  return (
    <div className="toh-st">
      <div className="toh-st__ph">
        <div>
          <h1>AI Studio</h1>
          <p>Try it. Then book it or shop it.</p>
        </div>
        <span className="toh-credpill">
          <span className="toh-coin" aria-hidden="true">
            C
          </span>
          <span className="toh-num">{viewer ? `${credits ?? "…"} credits` : "Sign in for credits"}</span>
        </span>
      </div>

      <p className="toh-st__demo" role="note">
        <span className="toh-pill toh-pill--demo">Demo</span>
        This preview uses illustrated models, so it costs no credits. Photo try-on switches on when the AI service is connected.
      </p>

      <div className="toh-stcats" role="tablist" aria-label="What to try">
        {CATEGORIES.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={category === item.key}
            className={category === item.key ? "is-on" : ""}
            onClick={() => {
              setCategory(item.key);
              setIndex(0);
            }}
          >
            <Icon name={item.icon} size={26} />
            <b>{item.label}</b>
            <small>{item.detail}</small>
          </button>
        ))}
      </div>

      <div className="toh-stgrid">
        <section className="toh-spanel">
          <h3>
            Your photo <small>Sample model</small>
          </h3>
          <div className="toh-you toh-art">
            <Portrait look={MODELS[model]!} overrides={STUDIO_BG} />
            <span className="toh-you__lbl">Model</span>
            {busy ? <div className="toh-scan" /> : null}
          </div>
          <button type="button" className="toh-btn toh-btn--block" style={{ marginTop: 12 }} disabled title="Available when the AI service is connected">
            <Icon name="upload" size={18} /> Upload a selfie
          </button>
          <p className="toh-st__fine">
            When photo try-on is live, your photo is deleted after 24 hours unless you save the look.
          </p>
          <h3 style={{ marginTop: 16 }}>Choose a model</h3>
          <div className="toh-models">
            {MODELS.map((look, position) => (
              <button
                key={look}
                type="button"
                className={`toh-art${model === position ? " is-on" : ""}`}
                aria-label={`Model ${position + 1}`}
                aria-pressed={model === position}
                onClick={() => setModel(position)}
              >
                <Portrait look={look} overrides={STUDIO_BG} />
              </button>
            ))}
          </div>
        </section>

        <section className="toh-spanel" style={{ minWidth: 0 }}>
          {result && shown ? (
            <>
              <h3>
                Your result{" "}
                <small>
                  {shown.name}
                  {result.colour !== null && shown.look !== "fade" ? ` · ${COLOURS[result.colour]![0]}` : ""}
                </small>
              </h3>
              <div className="toh-result">
                <div className="toh-art">
                  <Portrait look={MODELS[result.model]!} overrides={STUDIO_BG} />
                  <span className="toh-you__lbl">Before</span>
                </div>
                <div className="toh-art">
                  <LookArt {...result} />
                  <span className="toh-you__lbl">After</span>
                </div>
              </div>
              <div className="toh-st__acts">
                <button
                  type="button"
                  className="toh-btn"
                  onClick={() => {
                    save(shown.name);
                    toast.success(`Saved: ${shown.name}`);
                  }}
                >
                  <Icon name="bookmark" size={18} /> {saved.includes(shown.name) ? "Saved" : "Save look"}
                </button>
                <Link href={shown.find} className="toh-btn toh-btn--light">
                  <Icon name="pin" size={18} /> Find pros who do this
                </Link>
                <Link href="/marketplace" className="toh-btn toh-btn--line">
                  <Icon name="bag" size={18} /> Shop the look
                </Link>
                <button type="button" className="toh-btn toh-btn--line" onClick={() => setResult(null)}>
                  Try another
                </button>
              </div>
            </>
          ) : null}

          <h3>
            {CATEGORIES.find((item) => item.key === category)!.label} options <small>Free in the demo</small>
          </h3>
          <div className="toh-stopts">
            {options.map((option, position) => (
              <button key={option.name} type="button" className={index === position ? "is-on" : ""} aria-pressed={index === position} onClick={() => setIndex(position)}>
                <span className="toh-art">
                  <LookArt category={category} index={position} model={model} colour={category === "hair" ? colour : null} />
                </span>
                {option.name}
              </button>
            ))}
          </div>
          {category === "hair" ? (
            <>
              <h3 style={{ marginTop: 18 }}>
                Hair colour <small>{COLOURS[colour]![0]}</small>
              </h3>
              <div className="toh-swatches">
                {COLOURS.map(([name, hex], position) => (
                  <button
                    key={name}
                    type="button"
                    className={colour === position ? "is-on" : ""}
                    style={{ background: hex }}
                    aria-label={name}
                    aria-pressed={colour === position}
                    onClick={() => setColour(position)}
                  />
                ))}
              </div>
            </>
          ) : null}
          <div className="toh-tryrow">
            <button type="button" className="toh-trybtn" onClick={tryOn} disabled={busy}>
              <Icon name="spark" size={20} /> {busy ? "Creating your look…" : "Try it on"}
            </button>
            <span className="toh-st__fine" style={{ marginTop: 0 }}>
              Then book a pro who does it, near you.
            </span>
          </div>
        </section>

        <aside className="toh-spanel toh-anal">
          <h3>Book it</h3>
          <Link href={(shown ?? options[index]!).find} className="toh-an">
            <span className="toh-an__ic">
              <Icon name="pin" size={20} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <b>Pros who do {(shown ?? options[index]!).name.toLowerCase()}</b>
              <small>Verified businesses in Douala and Yaoundé</small>
            </span>
            <Icon name="chevR" size={16} />
          </Link>
          {saved.length ? (
            <div className="toh-an" style={{ cursor: "default" }}>
              <span className="toh-an__ic">
                <Icon name="bookmark" size={20} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b>Saved looks on this device</b>
                <small>{saved.slice(0, 3).join(", ")}</small>
              </span>
            </div>
          ) : null}
          <h3 style={{ marginTop: 18 }}>Shop for it</h3>
          <div className="toh-srec">
            {recommended.slice(0, 4).map((product) => (
              <Link key={product.id} href={`/marketplace/products/${product.id}`}>
                <span className="toh-art">{productArtFor(product)}</span>
                <span>{product.name.split(",")[0]}</span>
                <Price cents={lowestPrice(product)} size={13} />
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
