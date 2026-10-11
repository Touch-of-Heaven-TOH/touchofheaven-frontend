/** A small drawn map for cards that link to the real one. */
export function MapIllustration({ pins = 5 }: { pins?: number }) {
  const spots = [
    [170, 120],
    [420, 210],
    [560, 110],
    [300, 330],
    [640, 380],
    [480, 470],
  ].slice(0, pins);
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="800" height="600" fill="#eef0eb" />
      <path d="M470 0 C520 60 640 70 700 40 L800 30 L800 0Z" fill="#cde0f1" />
      <path d="M-20 600 C80 520 60 470 150 450 S250 520 330 600Z" fill="#d4e9cf" />
      <rect x="250" y="80" width="110" height="80" rx="16" fill="#d4e9cf" />
      <path d="M800 210 C700 200 680 260 600 250 S480 170 470 0" stroke="#cde0f1" strokeWidth="22" fill="none" />
      <path d="M0 300 C200 290 300 320 420 300 S650 280 800 300" stroke="#fff" strokeWidth="18" fill="none" />
      <path d="M400 0 C390 160 420 220 410 330 S380 520 400 600" stroke="#fff" strokeWidth="16" fill="none" />
      <path d="M0 520 L260 360 L420 300 L800 60" stroke="#fff" strokeWidth="12" fill="none" />
      <path d="M60 0 L240 600 M600 0 L560 600 M0 140 L800 180 M0 440 L800 420" stroke="#e2e4de" strokeWidth="5" fill="none" />
      {spots.map(([x, y], index) => (
        <g key={index} transform={`translate(${x} ${y})`}>
          <path d="M0 0c-18-18-26-28-26-40a26 26 0 0 1 52 0c0 12-8 22-26 40z" fill={index === 0 ? "#24132f" : "#7a2fe0"} />
          <circle cy="-40" r="9" fill="#fff" />
        </g>
      ))}
      <circle cx="400" cy="300" r="10" fill="#2f6fd6" stroke="#fff" strokeWidth="5" />
    </svg>
  );
}
