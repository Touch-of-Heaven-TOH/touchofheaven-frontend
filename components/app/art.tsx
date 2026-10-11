import { useId } from "react";

/**
 * Illustrated placeholders the app owns outright, ported from the
 * prototypes. A business, service or product without a real photo gets one
 * of these, picked deterministically from its id so the same card always
 * shows the same picture. No stock photos, nothing scraped.
 */

export type HairStyle = "braids" | "twists" | "locs" | "afro" | "fade" | "silk" | "bun" | "bob";

type PortraitOptions = {
  style: HairStyle;
  skin: string;
  hair?: string;
  bg1: string;
  bg2: string;
  top: string;
  ear?: boolean;
  lip?: string;
  lid?: string;
};

const SKIN = ["#7b4a2c", "#5a3420", "#a0673f", "#8e5634", "#3f2416", "#b07a4f"] as const;

export const LOOKS = {
  braids: { style: "braids", skin: SKIN[0], bg1: "#f3d9ff", bg2: "#ffc9de", top: "#7a2fe0" },
  box: { style: "braids", skin: SKIN[3], hair: "#3a2116", bg1: "#ffe3c7", bg2: "#f6b7c9", top: "#c2410c" },
  fade: { style: "fade", skin: SKIN[1], bg1: "#d9e4ff", bg2: "#c9b8ff", top: "#1f2a5a", ear: false },
  locs: { style: "locs", skin: SKIN[4], hair: "#3b2416", bg1: "#e8f3d9", bg2: "#f4d3a8", top: "#5b6b2a" },
  silk: { style: "silk", skin: SKIN[2], bg1: "#ffe0ef", bg2: "#e2c7ff", top: "#be185d" },
  twists: { style: "twists", skin: SKIN[5], bg1: "#fff1c9", bg2: "#ffc7b5", top: "#9a3412" },
  afro: { style: "afro", skin: SKIN[1], bg1: "#ffd9e6", bg2: "#d8c2ff", top: "#6d28d9" },
  bun: { style: "bun", skin: SKIN[2], bg1: "#e7defc", bg2: "#ffd6e7", top: "#4c1d95" },
  shape: { style: "afro", skin: SKIN[4], bg1: "#dfe9ff", bg2: "#cfd6e8", top: "#111827", ear: false },
  bob: { style: "bob", skin: SKIN[3], bg1: "#ffe6d6", bg2: "#f3c6e8", top: "#0f766e" },
  glam: { style: "bun", skin: SKIN[0], bg1: "#ffd6e2", bg2: "#f6c3a8", top: "#7c2d12", lip: "#8f1d3a", lid: "#7a2fe0" },
} satisfies Record<string, PortraitOptions>;

export type LookName = keyof typeof LOOKS;

export function hashString(value: string): number {
  let hash = 7;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

const CAP = "M31.5 51 C29 25 71 25 68.5 51 C65 37 35 37 31.5 51Z";

export function Portrait({
  look,
  overrides,
  className,
}: {
  look: LookName;
  overrides?: Partial<PortraitOptions>;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const o: PortraitOptions = { hair: "#1c1020", ear: true, ...LOOKS[look], ...overrides };
  const hair = o.hair ?? "#1c1020";
  let back: React.ReactNode = null;
  let cap: React.ReactNode = null;
  let extra: React.ReactNode = null;

  if (o.style === "braids" || o.style === "twists" || o.style === "locs") {
    const count = o.style === "locs" ? 8 : 11;
    const width = o.style === "locs" ? 4.6 : 3.1;
    const end = o.style === "locs" ? 104 : 118;
    const dash = o.style === "twists" ? "2.2 1.6" : o.style === "locs" ? "0" : "3 1.3";
    back = Array.from({ length: count }, (_, index) => {
      const x = 31 + index * (38 / (count - 1));
      const xe = x + (x - 50) * 0.45;
      return (
        <path
          key={index}
          d={`M${x.toFixed(1)} 42 C${(x + (x - 50) * 0.1).toFixed(1)} 70 ${xe.toFixed(1)} 90 ${xe.toFixed(1)} ${end}`}
          stroke={hair}
          strokeWidth={width}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={dash}
        />
      );
    });
    cap = <path d={CAP} fill={hair} />;
    if (o.style === "braids") {
      extra = (
        <>
          <circle cx="44" cy="104" r="1.6" fill="#e7c06b" />
          <circle cx="58" cy="108" r="1.6" fill="#e7c06b" />
        </>
      );
    }
  } else if (o.style === "afro") {
    back = <circle cx="50" cy="40" r="30" fill={hair} />;
  } else if (o.style === "fade") {
    cap = <path d="M32.5 47 C32 27 68 27 67.5 47 C64 39 36 39 32.5 47Z" fill={hair} />;
    extra = <path d="M35.5 58 C38 75 62 75 64.5 58 C60 69 40 69 35.5 58Z" fill={hair} opacity=".9" />;
  } else if (o.style === "silk") {
    back = <path d="M30 46 C26 76 28 100 33 114 L67 114 C72 100 74 76 70 46Z" fill={hair} />;
    cap = <path d={CAP} fill={hair} />;
  } else if (o.style === "bun") {
    back = <circle cx="50" cy="20" r="10" fill={hair} />;
    cap = <path d={CAP} fill={hair} />;
  } else if (o.style === "bob") {
    back = <path d="M29 46 C25 66 27 78 31 84 L69 84 C73 78 75 66 71 46Z" fill={hair} />;
    cap = <path d="M31 52 C28 24 72 24 69 52 C62 40 40 34 31 52Z" fill={hair} />;
  }

  return (
    <svg viewBox="0 0 100 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={o.bg1} />
          <stop offset="1" stopColor={o.bg2} />
        </linearGradient>
        <radialGradient id={`${id}s`} cx=".4" cy=".35" r=".7">
          <stop offset="0" stopColor="#fff" stopOpacity=".18" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill={`url(#${id}g)`} />
      {back}
      <path d="M14 122 C17 94 34 86 50 86 C66 86 83 94 86 122Z" fill={o.top} />
      <path d="M44 68h12v20c-3 3-9 3-12 0z" fill={o.skin} />
      <ellipse cx="50" cy="53" rx="17.5" ry="21" fill={o.skin} />
      <ellipse cx="50" cy="53" rx="17.5" ry="21" fill={`url(#${id}s)`} />
      {cap}
      {o.ear && o.style !== "fade" ? (
        <>
          <circle cx="32.6" cy="60" r="2" fill="#e7c06b" />
          <circle cx="67.4" cy="60" r="2" fill="#e7c06b" />
        </>
      ) : null}
      {extra}
      {o.lid ? (
        <path d="M40 52 q4-3 8 0 M52 52 q4-3 8 0" stroke={o.lid} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      ) : null}
      {o.lip ? <path d="M45 64.5 Q50 67.5 55 64.5 Q50 69.5 45 64.5Z" fill={o.lip} /> : null}
    </svg>
  );
}

export type ProductKind = "dropper" | "jar" | "bundle" | "tube" | "bonnet" | "polish" | "pump" | "comb" | "bottle";

const PRODUCT_COLOURS: [string, string][] = [
  ["#3f8f5a", "#bfe5c8"],
  ["#7a2fe0", "#e4d1ff"],
  ["#d9507f", "#ffd3e2"],
  ["#8a5a2b", "#f0d9b5"],
  ["#c08a24", "#f8e4b8"],
  ["#2a1a12", "#f1cfa6"],
];

/** A product's kind and colours from its name and id, so a list stays stable. */
export function productLook(name: string, id: string): { kind: ProductKind; c1: string; c2: string } {
  const text = name.toLowerCase();
  const kind: ProductKind = /oil|serum|drop/.test(text)
    ? "dropper"
    : /butter|gel|control|cream|mask/.test(text)
      ? "jar"
      : /hair|bundle|braid|extension/.test(text) && !/spray|comb/.test(text)
        ? "bundle"
        : /lip|tube/.test(text)
          ? "tube"
          : /bonnet|scarf/.test(text)
            ? "bonnet"
            : /polish|nail/.test(text)
              ? "polish"
              : /conditioner|shampoo|lotion|spray/.test(text)
                ? "pump"
                : /comb|brush/.test(text)
                  ? "comb"
                  : "bottle";
  const [c1, c2] = PRODUCT_COLOURS[hashString(id) % PRODUCT_COLOURS.length]!;
  return { kind, c1, c2 };
}

export function ProductArt({ kind, c1, c2, className }: { kind: ProductKind; c1: string; c2: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  let shape: React.ReactNode;
  switch (kind) {
    case "dropper":
      shape = (
        <>
          <rect x="38" y="52" width="24" height="44" rx="7" fill={c1} />
          <rect x="44" y="40" width="12" height="13" rx="2" fill="#2b1a33" />
          <ellipse cx="50" cy="35" rx="5" ry="7" fill="#2b1a33" />
          <rect x="41" y="64" width="18" height="16" rx="2" fill="#fff" opacity=".85" />
          <rect x="44" y="69" width="12" height="2" fill={c1} />
        </>
      );
      break;
    case "jar":
      shape = (
        <>
          <rect x="28" y="60" width="44" height="32" rx="8" fill={c1} />
          <rect x="26" y="50" width="48" height="12" rx="4" fill="#2b1a33" />
          <rect x="34" y="68" width="32" height="14" rx="2" fill="#fff" opacity=".85" />
        </>
      );
      break;
    case "bundle":
      shape = (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M${36 + i * 7} 26 C${26 + i * 7} 44 ${46 + i * 7} 60 ${34 + i * 7} 78 S ${42 + i * 7} 96 ${38 + i * 7} 102`}
              stroke={c1}
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
            />
          ))}
          <rect x="34" y="22" width="34" height="9" rx="3" fill="#e7c06b" />
        </>
      );
      break;
    case "tube":
      shape = (
        <>
          <path d="M40 30h20l-2 58H42z" fill={c1} />
          <rect x="40" y="86" width="20" height="10" rx="2" fill="#2b1a33" />
          <rect x="43" y="44" width="14" height="22" rx="2" fill="#fff" opacity=".8" />
        </>
      );
      break;
    case "bonnet":
      shape = (
        <>
          <path d="M22 72 C22 44 78 44 78 72 Z" fill={c1} />
          <path d="M20 72 C35 80 65 80 80 72" stroke={c2} strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      );
      break;
    case "polish":
      shape = [0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={22 + i * 20} y="58" width="16" height="30" rx="4" fill={["#c8324f", "#e8778f", "#7a2fe0"][i]} />
          <rect x={25 + i * 20} y="40" width="10" height="19" rx="2" fill="#2b1a33" />
        </g>
      ));
      break;
    case "pump":
      shape = (
        <>
          <rect x="36" y="48" width="28" height="48" rx="8" fill={c1} />
          <rect x="45" y="34" width="10" height="15" fill="#2b1a33" />
          <path d="M45 34h18v5H45z" fill="#2b1a33" />
          <rect x="40" y="60" width="20" height="18" rx="2" fill="#fff" opacity=".85" />
        </>
      );
      break;
    case "comb":
      shape = (
        <>
          <rect x="24" y="40" width="52" height="10" rx="3" fill={c1} />
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={26 + i * 4.2} y="50" width="2" height={i % 2 ? 22 : 26} fill={c1} />
          ))}
        </>
      );
      break;
    default:
      shape = (
        <>
          <rect x="40" y="44" width="20" height="52" rx="5" fill={c1} />
          <rect x="45" y="32" width="10" height="13" rx="2" fill="#2b1a33" />
          <rect x="42" y="58" width="16" height="18" rx="2" fill="#fff" opacity=".85" />
        </>
      );
  }
  return (
    <svg viewBox="0 0 100 110" preserveAspectRatio="xMidYMid meet" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c2} stopOpacity=".55" />
          <stop offset="1" stopColor={c2} stopOpacity=".2" />
        </linearGradient>
      </defs>
      <rect width="100" height="110" fill={`url(#${id}p)`} />
      <ellipse cx="50" cy="98" rx="26" ry="4" fill="#000" opacity=".08" />
      {shape}
    </svg>
  );
}

const VENUE_PALETTES: [string, string, string][] = [
  ["#f3e5ff", "#ffd9e8", "#7a2fe0"],
  ["#ffeede", "#f6d2c6", "#c2410c"],
  ["#e3ecff", "#d8d2ff", "#1f2a5a"],
  ["#e9f4e2", "#f7e2c4", "#5b6b2a"],
  ["#ffe4ef", "#ead6ff", "#be185d"],
];

export type VenueKind = "salon" | "barber" | "nails" | "spa";

/** A shop interior: mirrors and chairs, a barber pole, a polish shelf or a spa bed. */
export function VenueArt({ kind, seed, className }: { kind: VenueKind; seed: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const n = hashString(seed);
  const [w1, w2, acc] = VENUE_PALETTES[n % VENUE_PALETTES.length]!;
  const gold = "#d9b25a";
  const mx = [60, 150, 40, 110][n % 4]!;
  const mirror = (x: number) => (
    <g key={`m${x}`}>
      <path d={`M${x} 196 V96 a40 40 0 0 1 80 0 V196z`} fill="#fff" opacity=".6" stroke={gold} strokeWidth="5" />
      <path d={`M${x + 14} 120 l30 -30`} stroke="#fff" strokeWidth="6" opacity=".7" />
    </g>
  );
  const chair = (x: number) => (
    <g key={`c${x}`}>
      <rect x={x + 12} y="134" width="56" height="44" rx="14" fill={acc} />
      <rect x={x + 4} y="170" width="72" height="22" rx="9" fill={acc} />
      <rect x={x + 36} y="192" width="8" height="22" fill="#2b1a33" />
      <ellipse cx={x + 40} cy="216" rx="26" ry="5" fill="#2b1a33" />
    </g>
  );
  const plant = (x: number) => (
    <g key={`p${x}`}>
      <path d={`M${x} 214 l6-30h22l6 30z`} fill="#efe4da" />
      {[
        [-20, -14],
        [0, -30],
        [18, -16],
        [-8, -44],
        [12, -46],
      ].map(([dx, dy], i) => (
        <ellipse
          key={i}
          cx={x + 17 + dx!}
          cy={180 + dy!}
          rx="8"
          ry="20"
          fill={i % 2 ? "#3f8f5a" : "#5aa36f"}
          transform={`rotate(${dx! * 1.6} ${x + 17 + dx!} ${180 + dy!})`}
        />
      ))}
    </g>
  );
  const lamp = (x: number) => (
    <g key={`l${x}`}>
      <path d={`M${x} 0V40`} stroke="#2b1a33" strokeWidth="2" />
      <path d={`M${x - 16} 56a16 16 0 0 1 32 0z`} fill="#2b1a33" />
      <circle cx={x} cy="60" r="6" fill="#ffe7a3" />
    </g>
  );

  let scene: React.ReactNode;
  if (kind === "barber") {
    const pole = (mx + 290) % 380;
    scene = (
      <>
        {mirror(mx)}
        {chair(mx)}
        {mirror((mx + 140) % 300)}
        {chair((mx + 140) % 300)}
        <rect x={pole} y="70" width="18" height="110" rx="9" fill="#fff" />
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M${pole} ${78 + i * 22} l18 -12 v8 l-18 12z`} fill="#c8324f" />
        ))}
      </>
    );
  } else if (kind === "spa") {
    scene = (
      <>
        <rect x="40" y="150" width="320" height="34" rx="12" fill="#fff" opacity=".75" />
        <rect x="40" y="184" width="320" height="30" rx="6" fill={acc} opacity=".7" />
        <ellipse cx="120" cy="146" rx="40" ry="10" fill="#f5efe6" />
        {[0, 1, 2].map((i) => (
          <ellipse key={`s${i}`} cx={250 + i * 24} cy={146 - i * 8} rx={16 - i * 3} ry="6" fill="#4a4048" />
        ))}
        {[0, 1, 2].map((i) => (
          <g key={`k${i}`}>
            <rect x={70 + i * 30} y="96" width="14" height={30 + i * 6} rx="3" fill="#fff8e7" />
            <ellipse cx={77 + i * 30} cy="92" rx="3" ry="6" fill="#ffd36b" />
          </g>
        ))}
        {plant(330)}
      </>
    );
  } else if (kind === "nails") {
    const polish = ["#c8324f", "#e8778f", "#7a2fe0", "#f3c24f", "#3f8f5a", "#e97a2b", "#d9507f", "#2f6fd6", "#8b5a2b"];
    scene = (
      <>
        <rect x="30" y="150" width="340" height="18" rx="6" fill="#fff" />
        <rect x="50" y="168" width="10" height="50" fill="#2b1a33" />
        <rect x="340" y="168" width="10" height="50" fill="#2b1a33" />
        {polish.map((colour, i) => (
          <g key={colour}>
            <rect x={70 + i * 28} y={122 + ((i * 7) % 3) * 4} width="14" height={28 - ((i * 7) % 3) * 4} rx="3" fill={colour} />
            <rect x={73 + i * 28} y={110 + ((i * 7) % 3) * 4} width="8" height="12" rx="2" fill="#2b1a33" />
          </g>
        ))}
        {lamp(200)}
        {plant(10)}
      </>
    );
  } else {
    const single = n % 3 === 2;
    scene = (
      <>
        {mirror(mx)}
        {chair(mx)}
        {single ? null : mirror(mx + 150)}
        {single ? null : chair(mx + 150)}
        {plant(n % 2 ? 20 : 340)}
        {lamp(mx + 40)}
        {single ? null : lamp(mx + 190)}
      </>
    );
  }

  return (
    <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`${id}v`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={w1} />
          <stop offset="1" stopColor={w2} />
        </linearGradient>
      </defs>
      <rect width="400" height="280" fill={`url(#${id}v)`} />
      <rect y="214" width="400" height="66" fill={acc} opacity=".18" />
      <rect y="212" width="400" height="3" fill="#fff" opacity=".5" />
      {scene}
    </svg>
  );
}

const AVATAR_COLOURS = ["#7a2fe0", "#d9507f", "#17845a", "#c08a24", "#2f6fd6", "#8b5a2b"];

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function InitialsAvatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span
      className="toh-avatar"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: AVATAR_COLOURS[hashString(name) % AVATAR_COLOURS.length],
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
