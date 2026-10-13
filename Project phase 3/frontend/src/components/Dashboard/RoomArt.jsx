// Original room illustration for the Focus Den, drawn with SVG shapes.
// "focus" is a calm evening study room; "break" is the same room in daylight.
// Colors follow the site's navy and sky-blue palette.

const PALETTES = {
  focus: {
    wall: "#0b1120",
    wallShade: "#070d1a",
    floor: "#111a2e",
    sky: ["#020617", "#0c2a4d"],
    glow: "rgba(14,165,233,0.18)",
    lampOn: true,
  },
  break: {
    wall: "#1e3a5f",
    wallShade: "#17304f",
    floor: "#22344f",
    sky: ["#38bdf8", "#bae6fd"],
    glow: "rgba(255,255,255,0.06)",
    lampOn: false,
  },
};

const STARS = [
  [612, 168, 2], [668, 214, 1.5], [735, 152, 2.2], [790, 236, 1.4], [858, 178, 1.8],
  [905, 262, 1.3], [640, 288, 1.2], [820, 300, 1.6], [700, 330, 1.1], [880, 336, 1.4],
];

export default function RoomArt({ mode = "focus" }) {
  const p = PALETTES[mode === "focus" ? "focus" : "break"];
  const night = mode === "focus";

  return (
    <svg
      className="spirit-room-image"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={night ? "A calm study room in the evening" : "A study room in daylight"}
    >
      <defs>
        <linearGradient id="den-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.sky[0]} />
          <stop offset="100%" stopColor={p.sky[1]} />
        </linearGradient>
        <radialGradient id="den-lamp" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(253,224,171,0.55)" />
          <stop offset="100%" stopColor="rgba(253,224,171,0)" />
        </radialGradient>
        <linearGradient id="den-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.floor} />
          <stop offset="100%" stopColor={p.wallShade} />
        </linearGradient>
      </defs>

      {/* Walls and floor */}
      <rect width="1600" height="900" fill={p.wall} />
      <rect y="640" width="1600" height="260" fill="url(#den-floor)" />
      <rect y="632" width="1600" height="10" fill={p.wallShade} />

      {/* Window */}
      <rect x="560" y="120" width="420" height="300" rx="14" fill="#0f172a" />
      <rect x="574" y="134" width="392" height="272" rx="8" fill="url(#den-sky)" />
      {night ? (
        <>
          {STARS.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#e0f2fe" opacity="0.85" />
          ))}
          <circle cx="890" cy="190" r="30" fill="#f8fafc" />
          <circle cx="902" cy="182" r="26" fill={p.sky[0]} />
        </>
      ) : (
        <>
          <circle cx="880" cy="200" r="36" fill="#fef3c7" />
          <ellipse cx="680" cy="250" rx="60" ry="18" fill="#ffffff" opacity="0.85" />
          <ellipse cx="720" cy="238" rx="40" ry="16" fill="#ffffff" opacity="0.85" />
        </>
      )}
      <rect x="766" y="134" width="8" height="272" fill="#0f172a" />
      <rect x="574" y="266" width="392" height="8" fill="#0f172a" />
      <rect x="548" y="418" width="444" height="16" rx="6" fill="#1e293b" />

      {/* String lights */}
      <path d="M120 70 Q 800 150 1480 70" stroke="#334155" strokeWidth="3" fill="none" />
      {Array.from({ length: 13 }, (_, i) => {
        const x = 170 + i * 105;
        const y = 70 + Math.sin((i / 12) * Math.PI) * 78;
        return <circle key={i} cx={x} cy={y + 8} r="7" fill={night ? "#fde68a" : "#94a3b8"} opacity={night ? 0.95 : 0.6} />;
      })}

      {/* Bookshelf */}
      <rect x="1180" y="250" width="260" height="390" rx="8" fill="#1e293b" />
      {[300, 420, 540].map((y) => (
        <rect key={y} x="1180" y={y} width="260" height="10" fill="#334155" />
      ))}
      {[
        [1196, 252, 300, "#0ea5e9"], [1224, 262, 300, "#f97373"], [1250, 256, 300, "#22c55e"], [1278, 266, 300, "#facc15"],
        [1310, 372, 420, "#a5b4fc"], [1340, 366, 420, "#0ea5e9"], [1372, 376, 420, "#fb923c"],
        [1200, 492, 540, "#22c55e"], [1232, 486, 540, "#e2e8f0"], [1262, 494, 540, "#0369a1"],
      ].map(([x, top, shelf, color], i) => (
        <rect key={i} x={x} y={top} width="24" height={shelf - top} rx="3" fill={color} />
      ))}

      {/* Plant */}
      <rect x="170" y="560" width="90" height="80" rx="10" fill="#0369a1" />
      <ellipse cx="215" cy="520" rx="70" ry="60" fill="#15803d" />
      <ellipse cx="180" cy="480" rx="38" ry="46" fill="#16a34a" />
      <ellipse cx="252" cy="486" rx="34" ry="42" fill="#22c55e" />

      {/* Rug */}
      <ellipse cx="800" cy="790" rx="420" ry="70" fill="#0c4a6e" opacity="0.7" />
      <ellipse cx="800" cy="790" rx="360" ry="52" fill="none" stroke="#0ea5e9" strokeWidth="4" opacity="0.5" />

      {/* Desk */}
      <rect x="500" y="560" width="600" height="26" rx="8" fill="#334155" />
      <rect x="530" y="586" width="22" height="150" fill="#1e293b" />
      <rect x="1048" y="586" width="22" height="150" fill="#1e293b" />

      {/* Laptop */}
      <path d="M700 470 h200 a10 10 0 0 1 10 10 v80 h-220 v-80 a10 10 0 0 1 10 -10z" fill="#1e293b" />
      <rect x="708" y="480" width="184" height="76" rx="4" fill={night ? "#0ea5e9" : "#7dd3fc"} opacity="0.85" />
      <rect x="670" y="556" width="260" height="10" rx="4" fill="#475569" />

      {/* Mug */}
      <rect x="960" y="520" width="42" height="40" rx="6" fill="#e2e8f0" />
      <path d="M1002 528 q22 0 22 14 q0 14 -22 14" stroke="#e2e8f0" strokeWidth="6" fill="none" />
      {night && (
        <path d="M972 508 q-8 -14 0 -26 M988 508 q-8 -14 0 -26" stroke="#cbd5e1" strokeWidth="3" fill="none" opacity="0.6" />
      )}

      {/* Desk lamp */}
      <rect x="560" y="548" width="60" height="12" rx="4" fill="#475569" />
      <path d="M590 548 L 600 470 L 650 440" stroke="#475569" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M630 420 l60 20 l-30 40 z" fill="#64748b" />
      {p.lampOn && <circle cx="665" cy="500" r="150" fill="url(#den-lamp)" />}

      {/* Soft room tint */}
      <rect width="1600" height="900" fill={p.glow} />
    </svg>
  );
}
