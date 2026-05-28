"use client";

/**
 * DigitalBeaver — the SIAM Markets mascot.
 * Fully transparent background. Wireframe aesthetic.
 * Animated: float, tail wag, blink, LED pulse, circuit glow.
 * Use size= to scale. Use color= to accent.
 */

interface Props {
  size?:      number;
  color?:     string;
  animated?:  boolean;
  className?: string;
  style?:     React.CSSProperties;
}

export function DigitalBeaver({
  size      = 200,
  color     = "#00b4ff",
  animated  = true,
  className,
  style,
}: Props) {
  const uid  = `bv-${color.replace(/[^a-z0-9]/gi, "").slice(0, 6)}`;
  const glow = `${uid}-glow`;
  const clip = `${uid}-tailclip`;
  const an   = animated;

  return (
    <svg
      width={size}
      height={size * 1.32}
      viewBox="0 0 200 264"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: "visible", ...style }}
      aria-label="Digital Beaver mascot"
      role="img"
    >
      <defs>
        {/* Soft glow */}
        <filter id={glow} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Tail circuit clip */}
        <clipPath id={clip}>
          <ellipse cx="100" cy="238" rx="72" ry="25" />
        </clipPath>
      </defs>

      {/* ── CSS animations ──────────────────────────────────────── */}
      <style>{`
        @keyframes bv-float {
          0%,100% { transform: translateY(0);   }
          50%      { transform: translateY(-5px); }
        }
        @keyframes bv-tail {
          0%,100% { transform: rotate(-4deg); transform-origin: 100px 213px; }
          50%      { transform: rotate( 4deg); transform-origin: 100px 213px; }
        }
        @keyframes bv-blink-l {
          0%,88%,96%,100% { transform: scaleY(1);   transform-origin: 83px 88px; }
          92%              { transform: scaleY(0.08);transform-origin: 83px 88px; }
        }
        @keyframes bv-blink-r {
          0%,88%,96%,100% { transform: scaleY(1);   transform-origin: 117px 88px; }
          92%              { transform: scaleY(0.08);transform-origin: 117px 88px; }
        }
        @keyframes bv-led {
          0%,100% { opacity: 0.35; }
          50%      { opacity: 1;    }
        }
        @keyframes bv-circuit {
          0%,100% { opacity: 0.25; }
          50%      { opacity: 0.70; }
        }
        ${an ? `
        .${uid}-body     { animation: bv-float   3.4s ease-in-out infinite; }
        .${uid}-tail     { animation: bv-tail    2.2s ease-in-out infinite; }
        .${uid}-eye-l    { animation: bv-blink-l 5.0s ease-in-out infinite; }
        .${uid}-eye-r    { animation: bv-blink-r 5.0s ease-in-out infinite 0.12s; }
        .${uid}-led      { animation: bv-led     1.4s ease-in-out infinite; }
        .${uid}-circuit  { animation: bv-circuit 2.0s ease-in-out infinite; }
        ` : ""}
      `}</style>

      {/* ══════════════════════════════════════════════════════════
          LAYER 0 — TAIL (behind everything)
          ══════════════════════════════════════════════════════════ */}
      <g className={`${uid}-tail`} filter={`url(#${glow})`}>
        {/* Tail outline */}
        <ellipse cx="100" cy="238" rx="72" ry="25"
          stroke={color} strokeWidth="2" fill={`${color}12`} />
        {/* Inner shape */}
        <ellipse cx="100" cy="238" rx="58" ry="17"
          stroke={color} strokeWidth="0.8" strokeOpacity="0.35" fill="none" />

        {/* Circuit grid clipped to tail */}
        <g clipPath={`url(#${clip})`} className={`${uid}-circuit`}>
          {/* H-lines */}
          {[-12, -5, 0, 5, 12].map(dy => (
            <line key={dy}
              x1="32" y1={238 + dy} x2="168" y2={238 + dy}
              stroke={color} strokeWidth="0.7" strokeDasharray="5 3" strokeOpacity="0.55" />
          ))}
          {/* V-lines */}
          {[50, 65, 80, 100, 120, 135, 150].map(x => (
            <line key={x}
              x1={x} y1="214" x2={x} y2="262"
              stroke={color} strokeWidth="0.7" strokeDasharray="4 4" strokeOpacity="0.45" />
          ))}
          {/* Nodes at intersections */}
          {[50,65,80,100,120,135,150].flatMap(x =>
            [-12,-5,0,5,12].map(dy => (
              <circle key={`${x}-${dy}`}
                cx={x} cy={238 + dy} r="2.2"
                fill={color} fillOpacity="0.75" />
            ))
          )}
        </g>
      </g>

      {/* ══════════════════════════════════════════════════════════
          LAYER 1 — BODY GROUP (floats together)
          ══════════════════════════════════════════════════════════ */}
      <g className={`${uid}-body`}>

        {/* ── Feet ── */}
        <g filter={`url(#${glow})`}>
          {/* Left foot */}
          <ellipse cx="79" cy="208" rx="15" ry="7"
            stroke={color} strokeWidth="1.5" fill={`${color}15`} />
          <line x1="68" y1="213" x2="65" y2="218" stroke={color} strokeWidth="1" strokeLinecap="round" />
          <line x1="74" y1="215" x2="73" y2="221" stroke={color} strokeWidth="1" strokeLinecap="round" />
          <line x1="80" y1="215" x2="81" y2="221" stroke={color} strokeWidth="1" strokeLinecap="round" />

          {/* Right foot */}
          <ellipse cx="121" cy="208" rx="15" ry="7"
            stroke={color} strokeWidth="1.5" fill={`${color}15`} />
          <line x1="132" y1="213" x2="135" y2="218" stroke={color} strokeWidth="1" strokeLinecap="round" />
          <line x1="126" y1="215" x2="127" y2="221" stroke={color} strokeWidth="1" strokeLinecap="round" />
          <line x1="120" y1="215" x2="119" y2="221" stroke={color} strokeWidth="1" strokeLinecap="round" />
        </g>

        {/* ── Body ── */}
        <ellipse cx="100" cy="171" rx="47" ry="43"
          stroke={color} strokeWidth="2.2" fill={`${color}09`}
          filter={`url(#${glow})`} />
        {/* Belly circuit oval */}
        <ellipse cx="100" cy="177" rx="27" ry="27"
          stroke={color} strokeWidth="0.9" strokeOpacity="0.3" strokeDasharray="4 3" fill="none" />
        {/* Two tiny circuit nodes on belly */}
        <circle cx="90" cy="168" r="2" fill={color} fillOpacity="0.4" />
        <circle cx="110" cy="168" r="2" fill={color} fillOpacity="0.4" />
        <line x1="90" y1="168" x2="110" y2="168"
          stroke={color} strokeWidth="0.7" strokeOpacity="0.35" />

        {/* ── Left arm ── */}
        <path d="M 58 163 Q 42 172 46 192 Q 49 200 60 198"
          stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"
          filter={`url(#${glow})`} />
        {/* Left paw holding tiny chart tablet */}
        <g filter={`url(#${glow})`}>
          <rect x="33" y="190" width="20" height="15" rx="2"
            stroke={color} strokeWidth="1.5" fill={`${color}1a`} />
          {/* Tiny chart line on tablet */}
          <polyline points="36,201 39,197 42,199 45,193 49,195"
            stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"
            strokeOpacity="0.9" />
        </g>

        {/* ── Right arm ── */}
        <path d="M 142 163 Q 158 172 154 192 Q 151 200 140 198"
          stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"
          filter={`url(#${glow})`} />
        {/* Right paw */}
        <ellipse cx="152" cy="197" rx="11" ry="7" transform="rotate(15 152 197)"
          stroke={color} strokeWidth="1.5" fill={`${color}15`}
          filter={`url(#${glow})`} />
        <line x1="147" y1="202" x2="145" y2="207" stroke={color} strokeWidth="1" strokeLinecap="round" />
        <line x1="153" y1="204" x2="153" y2="210" stroke={color} strokeWidth="1" strokeLinecap="round" />
        <line x1="158" y1="202" x2="161" y2="207" stroke={color} strokeWidth="1" strokeLinecap="round" />

        {/* ── Ears (behind head) ── */}
        <g filter={`url(#${glow})`}>
          {/* Left ear */}
          <circle cx="74" cy="58" r="15"
            stroke={color} strokeWidth="2" fill={`${color}09`} />
          <circle cx="74" cy="58" r="8"
            stroke={color} strokeWidth="1.2" fill={`${color}1e`} strokeOpacity="0.65" />

          {/* Right ear */}
          <circle cx="126" cy="58" r="15"
            stroke={color} strokeWidth="2" fill={`${color}09`} />
          <circle cx="126" cy="58" r="8"
            stroke={color} strokeWidth="1.2" fill={`${color}1e`} strokeOpacity="0.65" />
        </g>

        {/* ── Head ── */}
        <circle cx="100" cy="95" r="47"
          stroke={color} strokeWidth="2.5" fill={`${color}09`}
          filter={`url(#${glow})`} />

        {/* Subtle cheek circles */}
        <circle cx="72" cy="102" r="12"
          stroke={color} strokeWidth="0.8" strokeOpacity="0.22" fill={color} fillOpacity="0.04" />
        <circle cx="128" cy="102" r="12"
          stroke={color} strokeWidth="0.8" strokeOpacity="0.22" fill={color} fillOpacity="0.04" />

        {/* ── Left eye ── */}
        <g className={`${uid}-eye-l`}>
          <circle cx="83" cy="87" r="10"
            stroke={color} strokeWidth="1.8" fill={`${color}1c`} />
          <circle cx="84" cy="88" r="5.5" fill={color} />
          <circle cx="86.5" cy="85.5" r="2.2" fill="white" fillOpacity="0.92" />
          <circle cx="81" cy="90" r="1" fill="white" fillOpacity="0.4" />
        </g>

        {/* ── Right eye ── */}
        <g className={`${uid}-eye-r`}>
          <circle cx="117" cy="87" r="10"
            stroke={color} strokeWidth="1.8" fill={`${color}1c`} />
          <circle cx="118" cy="88" r="5.5" fill={color} />
          <circle cx="120.5" cy="85.5" r="2.2" fill="white" fillOpacity="0.92" />
          <circle cx="115" cy="90" r="1" fill="white" fillOpacity="0.4" />
        </g>

        {/* ── Nose ── */}
        <ellipse cx="100" cy="107" rx="6.5" ry="4.5"
          stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.65" />
        {/* Nose line */}
        <line x1="100" y1="111" x2="100" y2="116"
          stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7" />

        {/* ── Smile ── */}
        <path d="M 88 118 Q 100 127 112 118"
          stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* ── Whiskers (left) ── */}
        <line x1="93" y1="109" x2="64" y2="103" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.55" />
        <line x1="93" y1="114" x2="62" y2="114" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.55" />
        <line x1="93" y1="119" x2="65" y2="123" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.40" />

        {/* ── Whiskers (right) ── */}
        <line x1="107" y1="109" x2="136" y2="103" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.55" />
        <line x1="107" y1="114" x2="138" y2="114" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.55" />
        <line x1="107" y1="119" x2="135" y2="123" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.40" />

        {/* ── Buck teeth ── */}
        <rect x="91.5" y="116" width="8" height="12" rx="2"
          stroke={color} strokeWidth="1.6" fill="white" fillOpacity="0.88" />
        <rect x="100.5" y="116" width="8" height="12" rx="2"
          stroke={color} strokeWidth="1.6" fill="white" fillOpacity="0.88" />
        {/* Center groove */}
        <line x1="100" y1="116" x2="100" y2="128"
          stroke={color} strokeWidth="1" strokeOpacity="0.4" />

        {/* ── Forehead circuit traces ── */}
        <path d="M 70 76 L 78 70 L 86 70"
          stroke={color} strokeWidth="0.9" strokeOpacity="0.38" fill="none" />
        <circle cx="78" cy="70" r="1.8" fill={color} fillOpacity="0.45" />
        <path d="M 130 76 L 122 70 L 114 70"
          stroke={color} strokeWidth="0.9" strokeOpacity="0.38" fill="none" />
        <circle cx="122" cy="70" r="1.8" fill={color} fillOpacity="0.45" />

        {/* ── Antenna with pulsing LED ── */}
        <line x1="100" y1="48" x2="100" y2="34"
          stroke={color} strokeWidth="1.8" strokeLinecap="round"
          filter={`url(#${glow})`} />
        {/* Antenna ball */}
        <circle cx="100" cy="30" r="5"
          stroke={color} strokeWidth="1.5"
          fill={color} fillOpacity="0.45"
          className={`${uid}-led`}
          filter={`url(#${glow})`} />
        {/* Inner LED dot */}
        <circle cx="100" cy="30" r="2.5"
          fill={color} fillOpacity="0.9"
          className={`${uid}-led`} />
      </g>
    </svg>
  );
}
