/**
 * Ilustração arquitetônica em traço (substitui a foto do topo enquanto
 * `heroImage.src` estiver vazio). Puramente decorativa.
 */
export function ArchitecturalArt({ className = "" }: { className?: string }) {
  const ivory = "#f7f2ea";
  const gold = "#d9bf8c";

  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id="arch-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1730" />
          <stop offset="1" stopColor="#3a2140" />
        </linearGradient>
        <pattern id="arch-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke={ivory} strokeOpacity="0.05" strokeWidth="0.6" />
        </pattern>
        <pattern id="arch-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={ivory} strokeOpacity="0.14" strokeWidth="0.7" />
        </pattern>
      </defs>

      <rect width="400" height="500" fill="url(#arch-bg)" />
      <rect width="400" height="500" fill="url(#arch-grid)" />

      {/* construction lines */}
      <g stroke={ivory} strokeOpacity="0.12" strokeWidth="0.6" strokeDasharray="3 4">
        <line x1="0" y1="180" x2="400" y2="180" />
        <line x1="0" y1="250" x2="400" y2="250" />
        <line x1="70" y1="0" x2="70" y2="500" />
        <line x1="300" y1="0" x2="300" y2="500" />
      </g>

      {/* sun */}
      <circle cx="292" cy="118" r="44" fill={gold} fillOpacity="0.1" stroke={gold} strokeWidth="1" />
      <circle cx="292" cy="118" r="58" fill="none" stroke={gold} strokeOpacity="0.35" strokeWidth="0.6" />

      <g fill="none" stroke={ivory} strokeWidth="1.2" strokeLinejoin="round">
        {/* upper volume */}
        <rect x="120" y="186" width="150" height="64" strokeOpacity="0.85" />
        <rect x="136" y="200" width="34" height="34" strokeOpacity="0.7" />
        <rect x="178" y="200" width="34" height="34" strokeOpacity="0.7" />
        <rect x="220" y="200" width="34" height="34" strokeOpacity="0.7" />

        {/* main volume */}
        <rect x="70" y="257" width="230" height="143" strokeOpacity="0.9" />
        <rect x="222" y="257" width="78" height="143" fill="url(#arch-hatch)" strokeOpacity="0.5" />

        {/* glazing */}
        <rect x="92" y="290" width="112" height="110" strokeOpacity="0.9" />
        <line x1="120" y1="290" x2="120" y2="400" strokeOpacity="0.6" />
        <line x1="148" y1="290" x2="148" y2="400" strokeOpacity="0.6" />
        <line x1="176" y1="290" x2="176" y2="400" strokeOpacity="0.6" />
        <rect x="238" y="300" width="46" height="100" strokeOpacity="0.75" />
      </g>

      {/* slabs */}
      <rect x="104" y="179" width="186" height="7" fill={ivory} fillOpacity="0.9" />
      <rect x="44" y="250" width="270" height="7" fill={ivory} fillOpacity="0.9" />

      {/* warm light inside */}
      <rect x="93" y="291" width="110" height="108" fill={gold} fillOpacity="0.16" />

      {/* tree */}
      <g fill="none" stroke={gold} strokeWidth="1">
        <line x1="346" y1="300" x2="346" y2="400" />
        <circle cx="346" cy="272" r="34" strokeOpacity="0.8" />
        <circle cx="346" cy="272" r="22" strokeOpacity="0.35" />
      </g>

      {/* ground + dimension line */}
      <line x1="16" y1="400" x2="384" y2="400" stroke={gold} strokeWidth="1.2" />
      <g stroke={ivory} strokeOpacity="0.4" strokeWidth="0.8">
        <line x1="70" y1="428" x2="300" y2="428" />
        <line x1="70" y1="422" x2="70" y2="434" />
        <line x1="300" y1="422" x2="300" y2="434" />
        <line x1="185" y1="424" x2="185" y2="432" />
      </g>

      <text
        x="24"
        y="474"
        fill={ivory}
        fillOpacity="0.55"
        fontSize="9"
        letterSpacing="3.2"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        MANAUS · AMAZONAS
      </text>
      <text
        x="376"
        y="474"
        textAnchor="end"
        fill={gold}
        fillOpacity="0.8"
        fontSize="9"
        letterSpacing="3.2"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        3°06′S
      </text>
    </svg>
  );
}
