"use client";

/**
 * World Markets Map · Bloomberg WLD analogue · split-panel.
 *
 *   ┌──────────┬──────────────────────────────────────┐
 *   │ AMERICAS │  EUROPE · MIDDLE EAST · ASIA · APAC  │
 *   │  ~30%    │                ~70%                  │
 *   └──────────┴──────────────────────────────────────┘
 *
 *  • Each panel uses its own bounded equirectangular projection so
 *    Europe & Asia get the horizontal real estate they deserve and
 *    the Pacific Ocean stops eating half the canvas.
 *  • Each pin has an explicit `labelDir` (N/NE/E/SE/...) so dense
 *    clusters in East Asia / Northern Europe don't collide.
 *  • Tier 3/4 pins use a compact 2-line label (city + Δ%) — full
 *    index name surfaces in the tooltip.
 *
 *  Five layers, session-aware rings, sparklines + 1D/5D/MTD/YTD,
 *  country macro, central banks (RATES), foreign-flow arrow on BKK,
 *  macro calendar strip, Bloomberg-ribbon ticker. Same as before.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MARKET_LOCATIONS, joinQuotesToLocations, vibeOf, VIBE_COLOR, VIBE_LABEL,
  TIER_SIZE, sessionStatus, SESSION_COLOR, SESSION_LABEL, LAYER_LABEL,
  multiTimeframe, sparklinePoints,
  panelOf, PANEL_BOUNDS, projectInPanel, labelOffset,
  type MarketPin, type Layer, type HistoryPoint, type Panel,
} from "@/lib/markets-map";
import { CENTRAL_BANKS, STANCE_COLOR, moveLabel, daysUntil } from "@/lib/central-banks";
import { COUNTRY_MACRO } from "@/lib/country-macro";
import { MACRO_CALENDAR, eventDaysUntil, impactColor } from "@/lib/macro-calendar";
import type { MilitaryFlight, MilitaryFlightResponse } from "@/app/api/military-flights/route";

// Simplified continent silhouettes — drawn in world coords, projected per panel
type Poly = [number, number][];
const CONTINENTS: { name: string; coords: Poly }[] = [
  { name: "North America", coords: [[-168,65],[-165,55],[-155,58],[-130,55],[-125,49],[-122,38],[-118,33],[-110,24],[-100,22],[-90,18],[-87,15],[-83,17],[-80,24],[-75,35],[-70,41],[-67,45],[-60,47],[-55,50],[-58,56],[-65,62],[-78,71],[-95,73],[-115,73],[-140,70],[-155,71],[-168,65]] },
  { name: "Greenland", coords: [[-50,60],[-25,60],[-15,70],[-22,80],[-45,83],[-60,78],[-58,70],[-50,60]] },
  { name: "South America", coords: [[-78,12],[-72,8],[-60,8],[-52,3],[-45,-2],[-35,-7],[-37,-16],[-43,-23],[-50,-31],[-58,-38],[-67,-46],[-72,-54],[-74,-52],[-71,-42],[-72,-32],[-76,-20],[-80,-10],[-81,-2],[-79,6],[-78,12]] },
  { name: "Europe", coords: [[-10,36],[0,36],[10,38],[18,40],[25,36],[32,37],[40,40],[40,50],[35,60],[25,65],[12,65],[5,60],[-2,58],[-8,54],[-10,50],[-5,45],[-10,40],[-10,36]] },
  { name: "Africa", coords: [[-17,14],[-15,28],[-5,33],[10,35],[25,32],[33,30],[37,17],[44,12],[51,11],[51,2],[42,-10],[32,-25],[22,-34],[18,-34],[14,-28],[12,-18],[10,-7],[8,0],[3,5],[-5,6],[-12,10],[-17,14]] },
  { name: "Arabia", coords: [[33,30],[40,28],[48,22],[55,18],[58,22],[55,30],[50,30],[44,33],[38,35],[33,35],[33,30]] },
  { name: "Asia", coords: [[40,50],[55,55],[65,70],[85,75],[110,75],[140,72],[170,68],[180,65],[165,60],[150,52],[140,45],[135,38],[128,35],[122,30],[115,22],[109,17],[103,12],[98,9],[95,15],[92,22],[83,22],[76,14],[75,22],[68,23],[62,25],[55,26],[48,30],[44,38],[40,42],[40,50]] },
  { name: "Indochina", coords: [[97,5],[100,10],[102,14],[105,12],[108,11],[109,16],[105,20],[100,20],[97,16],[97,5]] },
  { name: "Australia", coords: [[114,-22],[122,-18],[130,-12],[137,-12],[142,-10],[146,-18],[152,-25],[150,-36],[144,-38],[136,-35],[124,-34],[114,-28],[114,-22]] },
  { name: "Japan", coords: [[131,31],[136,34],[141,41],[144,44],[141,41],[137,36],[132,33],[131,31]] },
  { name: "Indonesia", coords: [[95,5],[100,0],[108,-3],[115,-5],[120,-5],[115,-8],[108,-8],[103,-6],[97,1],[95,5]] },
];

function continentPath(coords: Poly, panel: Panel): string {
  return coords
    .map((c, i) => {
      const p = projectInPanel(c[0], c[1], panel);
      return `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    })
    .join(" ") + " Z";
}

// ─── Component ────────────────────────────────────────────────

interface Props {
  quotes: Array<{ symbol: string; price?: number; changePct?: number }>;
  histories?: Record<string, HistoryPoint[]>;
  foreignFlow?: { d5: number; d20: number };
}

const LAYER_ORDER: Layer[] = ["EQUITY", "COMMODITIES", "FX", "RATES", "VOL", "FLIGHTS"];

export function WorldMarketsMap({ quotes, histories = {}, foreignFlow }: Props) {
  const allPins = useMemo(() => joinQuotesToLocations(quotes), [quotes]);
  const [layer, setLayer] = useState<Layer>("EQUITY");
  const [hover, setHover] = useState<MarketPin | null>(null);
  const [hoverBank, setHoverBank] = useState<typeof CENTRAL_BANKS[number] | null>(null);
  const [hoverFlight, setHoverFlight] = useState<MilitaryFlight | null>(null);

  // Military flight data — fetched client-side when FLIGHTS layer is active
  const [flightData, setFlightData] = useState<MilitaryFlightResponse | null>(null);
  const [flightLoading, setFlightLoading] = useState(false);
  const flightIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (layer !== "FLIGHTS") {
      if (flightIntervalRef.current) clearInterval(flightIntervalRef.current);
      return;
    }
    const load = () => {
      setFlightLoading(true);
      fetch("/api/military-flights")
        .then(r => r.json())
        .then((d: MilitaryFlightResponse) => { setFlightData(d); setFlightLoading(false); })
        .catch(() => setFlightLoading(false));
    };
    load();
    flightIntervalRef.current = setInterval(load, 60_000);
    return () => { if (flightIntervalRef.current) clearInterval(flightIntervalRef.current); };
  }, [layer]);

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const pins = useMemo(() => allPins.filter(p => p.layer === layer), [allPins, layer]);
  const live = pins.filter(p => p.changePct !== null);
  const allLive = allPins.filter(p => p.changePct !== null);

  const up = live.filter(p => (p.changePct ?? 0) > 0).length;
  const down = live.filter(p => (p.changePct ?? 0) < 0).length;
  const avg = live.length ? live.reduce((s, p) => s + (p.changePct ?? 0), 0) / live.length : 0;
  const best  = live.length ? live.reduce((b, p) => ((p.changePct ?? 0) > (b.changePct ?? 0) ? p : b), live[0]) : null;
  const worst = live.length ? live.reduce((b, p) => ((p.changePct ?? 0) < (b.changePct ?? 0) ? p : b), live[0]) : null;

  const equityPins = allPins.filter(p => p.layer === "EQUITY");
  const openCount = equityPins.filter(p => sessionStatus(p, now) === "open").length;

  const tickerItems = useMemo(() => allLive, [allLive]);

  const americasPins = pins.filter(p => panelOf(p.lon) === "americas");
  const emeaApacPins = pins.filter(p => panelOf(p.lon) === "emeaApac");

  const hoverMacro    = hover ? COUNTRY_MACRO[hover.country] : null;
  const hoverHistory  = hover ? histories[hover.symbol] ?? [] : [];
  const hoverTimeline = hoverHistory.length ? multiTimeframe(hoverHistory) : null;
  const hoverIsHome   = hover?.id === "bkk";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 0, height: "100%" }}>
      <MacroCalendarStrip />

      {/* Top header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 12,
          padding: "8px 14px",
          background: "var(--bg-raised)",
          border: "1px solid var(--line)",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "baseline", flexWrap: "wrap", minWidth: 0 }}>
          <span className="t-micro" style={{ letterSpacing: "0.18em", color: "var(--ink)" }}>
            {LAYER_LABEL[layer].toUpperCase()}
          </span>
          {layer === "FLIGHTS" ? (
            <>
              <Stat label="flagged aircraft" value={flightLoading ? "…" : `${flightData?.flagged ?? 0}`} color="var(--bear)" />
              <Stat label="total seen"       value={flightLoading ? "…" : `${flightData?.total_seen ?? 0}`} color="var(--muted)" />
              <Stat label="region" value="SE ASIA · 0–28°N · 92–135°E" color="var(--muted)" />
              {flightData && <Stat label="as of" value={flightData.as_of.slice(11, 16) + " UTC"} color="var(--dim)" />}
            </>
          ) : (
            <>
              <Stat label="up"   value={`${up}`}        color="var(--bull)" />
              <Stat label="down" value={`${down}`}      color="var(--bear)" />
              <Stat label="live" value={`${live.length}/${pins.length}`} color="var(--muted)" />
              <Stat label="avg"  value={`${avg >= 0 ? "+" : ""}${avg.toFixed(2)}%`} color={avg >= 0 ? "var(--bull)" : "var(--bear)"} />
              {layer === "EQUITY" && (
                <Stat label="open now" value={`${openCount}/${equityPins.length}`} color="var(--bull)" />
              )}
              {best  && <Stat label="top"     value={`${best.city} ${(best.changePct  ?? 0) >= 0 ? "+" : ""}${(best.changePct  ?? 0).toFixed(2)}%`} color="var(--bull)" />}
              {worst && <Stat label="laggard" value={`${worst.city} ${(worst.changePct ?? 0).toFixed(2)}%`} color="var(--bear)" />}
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {LAYER_ORDER.map(l => (
            <button
              key={l}
              onClick={() => setLayer(l)}
              style={{
                background: layer === l ? "var(--tech-10)" : "transparent",
                border: `1px solid ${layer === l ? "var(--tech)" : "var(--line)"}`,
                color: layer === l ? "var(--tech)" : "var(--muted)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.625rem",
                letterSpacing: "0.14em",
                fontWeight: 700,
                padding: "4px 10px",
                cursor: "pointer",
                minHeight: 28,
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Split-panel map ─────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "1fr 1px minmax(0, 2.1fr)",
          gap: 0,
          background: "var(--line)",
          border: "1px solid var(--line)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* AMERICAS panel */}
        <Panel
          panelKey="americas"
          title="AMERICAS"
          pins={americasPins}
          centralBanks={layer === "RATES" ? CENTRAL_BANKS.filter(b => panelOf(b.lon) === "americas") : []}
          hover={hover}
          setHover={setHover}
          hoverBank={hoverBank}
          setHoverBank={setHoverBank}
          now={now}
          foreignFlow={foreignFlow}
          layer={layer}
        />

        <div style={{ background: "var(--line)" }} />

        {/* EMEA + APAC panel */}
        <Panel
          panelKey="emeaApac"
          title="EUROPE · MIDDLE EAST · ASIA · APAC"
          pins={emeaApacPins}
          centralBanks={layer === "RATES" ? CENTRAL_BANKS.filter(b => panelOf(b.lon) === "emeaApac") : []}
          hover={hover}
          setHover={setHover}
          hoverBank={hoverBank}
          setHoverBank={setHoverBank}
          now={now}
          foreignFlow={foreignFlow}
          layer={layer}
        />

        {/* Tooltip — shared, positioned to top-right of whole map */}
        {hover && (
          <Tooltip
            hover={hover}
            hoverHistory={hoverHistory}
            hoverTimeline={hoverTimeline}
            hoverMacro={hoverMacro}
            hoverIsHome={hoverIsHome}
            foreignFlow={foreignFlow}
            now={now}
          />
        )}
        {hoverBank && !hover && (
          <BankTooltip bank={hoverBank} />
        )}

        {/* FLIGHTS overlay — renders over both panels when FLIGHTS layer active */}
        {layer === "FLIGHTS" && (
          <FlightOverlay
            flights={flightData?.flights ?? []}
            loading={flightLoading}
            hover={hoverFlight}
            setHover={setHoverFlight}
          />
        )}
      </div>

      {/* Ticker */}
      <div style={{ position: "relative", overflow: "hidden", border: "1px solid var(--line)", background: "var(--bg-raised)", minHeight: 32 }}>
        <div
          style={{
            display: "inline-flex",
            gap: 22,
            padding: "8px 0",
            whiteSpace: "nowrap",
            animation: "tickerScroll 120s linear infinite",
          }}
        >
          {tickerItems.concat(tickerItems).map((p, i) => {
            const color = VIBE_COLOR[vibeOf(p.changePct)];
            const session = sessionStatus(p, now);
            return (
              <span key={`${p.id}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 5, height: 5, background: SESSION_COLOR[session] }} />
                <span className="t-body" style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--ink)" }}>{p.indexLabel}</span>
                <span className="t-mono" style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>
                  {p.price === null ? "—" : p.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className="t-mono" style={{ fontSize: "0.6875rem", fontWeight: 700, color }}>
                  {p.changePct === null
                    ? "—"
                    : `${p.changePct >= 0 ? "+" : ""}${p.changePct.toFixed(2)}%`}
                </span>
              </span>
            );
          })}
        </div>
        <style>{`
          @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        `}</style>
      </div>

      <div className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em" }}>
        SPLIT PROJECTION · AMERICAS ◀│▶ EMEA · ASIA · APAC · TEXT SIZE ∝ CAP · COLOR ∝ Δ% · RING ∝ SESSION · AS OF {now.toISOString().slice(11, 16)} UTC
      </div>
    </div>
  );
}

// ─── Panel sub-component ─────────────────────────────────────

interface PanelProps {
  panelKey: Panel;
  title: string;
  pins: MarketPin[];
  centralBanks: typeof CENTRAL_BANKS;
  hover: MarketPin | null;
  setHover: (p: MarketPin | null) => void;
  hoverBank: typeof CENTRAL_BANKS[number] | null;
  setHoverBank: (b: typeof CENTRAL_BANKS[number] | null) => void;
  now: Date;
  foreignFlow?: { d5: number; d20: number };
  layer: Layer;
}

function Panel({ panelKey, title, pins, centralBanks, hover, setHover, hoverBank, setHoverBank, now, foreignFlow, layer }: PanelProps) {
  const b = PANEL_BOUNDS[panelKey];

  return (
    <div style={{ position: "relative", background: "var(--bg-raised)", minWidth: 0, minHeight: 0, overflow: "hidden" }}>
      {/* Panel header label */}
      <div
        style={{
          position: "absolute",
          top: 6,
          left: 8,
          fontFamily: "var(--font-mono)",
          fontSize: "0.55rem",
          fontWeight: 700,
          letterSpacing: "0.18em",
          color: "var(--muted)",
          padding: "3px 6px",
          background: "var(--bg-raised)",
          border: "1px solid var(--line)",
          zIndex: 2,
        }}
      >
        {title}
      </div>

      <svg
        viewBox={`0 0 ${b.width} ${b.height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
      >
        {/* Lat/lon grid */}
        {(() => {
          const lonGridStep = 15;
          const startLon = Math.ceil(b.lonMin / lonGridStep) * lonGridStep;
          const lines = [];
          for (let lon = startLon; lon <= b.lonMax; lon += lonGridStep) {
            const x = projectInPanel(lon, 0, panelKey).x;
            lines.push(
              <line key={`lon-${lon}`} x1={x} y1={0} x2={x} y2={b.height}
                stroke="var(--line)" strokeWidth={lon === 0 ? 0.8 : 0.3}
                opacity={lon === 0 ? 0.7 : 0.3} />
            );
          }
          return lines;
        })()}
        {[-60, -30, 0, 30, 60].map(lat => {
          if (lat < b.latMin || lat > b.latMax) return null;
          const y = projectInPanel(0, lat, panelKey).y;
          return (
            <line key={`lat-${lat}`} x1={0} y1={y} x2={b.width} y2={y}
              stroke={lat === 0 ? "var(--braun-yellow, #ffd000)" : "var(--line)"}
              strokeWidth={lat === 0 ? 0.7 : 0.3}
              opacity={lat === 0 ? 0.55 : 0.3}
              strokeDasharray={lat === 0 ? "4 4" : undefined} />
          );
        })}

        {/* Continents */}
        {CONTINENTS.map(c => (
          <path key={c.name} d={continentPath(c.coords, panelKey)}
            fill="var(--ink)" fillOpacity={0.05}
            stroke="var(--ink)" strokeOpacity={0.18} strokeWidth={0.5} />
        ))}

        {/* Pins */}
        {pins.map(p => (
          <PinG key={p.id} p={p} panelKey={panelKey} now={now}
            isHover={hover?.id === p.id}
            setHover={setHover} foreignFlow={foreignFlow} layer={layer} />
        ))}

        {/* Central banks (RATES only) */}
        {centralBanks.map(bank => {
          const { x, y } = projectInPanel(bank.lon, bank.lat, panelKey);
          const stanceColor = STANCE_COLOR[bank.stance];
          const days = daysUntil(bank.nextMeeting);
          const labelAnchor: "start" | "end" = bank.lon > 90 ? "end" : "start";
          const labelDx = labelAnchor === "start" ? 8 : -8;
          const isHomeBank = !!bank.highlight;
          const acronym = bank.bank
            .replace("Federal Reserve", "Fed").replace("European Central Bank", "ECB")
            .replace("Bank of England", "BOE").replace("Bank of Japan", "BOJ")
            .replace("People's Bank of China", "PBOC").replace("Reserve Bank of India", "RBI")
            .replace("Reserve Bank of Australia", "RBA").replace("Bank of Thailand", "BOT")
            .replace("Banco Central do Brasil", "BCB").replace("MAS Singapore", "MAS")
            .replace("Bank of Russia", "CBR").replace("Saudi Central Bank", "SAMA");
          return (
            <g key={bank.id}
              onMouseEnter={() => setHoverBank(bank)}
              onMouseLeave={() => setHoverBank(hoverBank?.id === bank.id ? null : hoverBank)}>
              {isHomeBank && (
                <rect x={x - 8} y={y - 8} width={16} height={16}
                  fill="none" stroke="var(--braun-yellow, #ffd000)"
                  strokeWidth={1.2} opacity={0.85} />
              )}
              <rect x={x - 5} y={y - 5} width={10} height={10}
                fill={stanceColor} stroke="var(--bg)" strokeWidth={0.6} />
              <circle cx={x} cy={y} r={14} fill="transparent" />
              <text x={x + labelDx} y={y - 2}
                fontFamily="var(--font-mono)" fontSize={10} fontWeight={700}
                fill={isHomeBank ? "var(--braun-yellow, #ffd000)" : "var(--ink)"}
                textAnchor={labelAnchor}
                style={{ paintOrder: "stroke", stroke: "var(--bg)", strokeWidth: 3 }}>
                {acronym}
              </text>
              <text x={x + labelDx} y={y + 10}
                fontFamily="var(--font-mono)" fontSize={12} fontWeight={700}
                fill={stanceColor} textAnchor={labelAnchor}
                style={{ paintOrder: "stroke", stroke: "var(--bg)", strokeWidth: 3 }}>
                {bank.rate.toFixed(2)}%
              </text>
              <text x={x + labelDx} y={y + 20}
                fontFamily="var(--font-mono)" fontSize={7}
                fill="var(--muted)" textAnchor={labelAnchor}
                style={{ paintOrder: "stroke", stroke: "var(--bg)", strokeWidth: 3 }}>
                next {days >= 0 ? `${days}d` : "—"}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Pin renderer ────────────────────────────────────────────

interface PinGProps {
  p: MarketPin;
  panelKey: Panel;
  now: Date;
  isHover: boolean;
  setHover: (p: MarketPin | null) => void;
  foreignFlow?: { d5: number; d20: number };
  layer: Layer;
}

function PinG({ p, panelKey, now, isHover, setHover, foreignFlow, layer }: PinGProps) {
  const { x, y } = projectInPanel(p.lon, p.lat, panelKey);
  const v = vibeOf(p.changePct);
  const vibeColor = VIBE_COLOR[v];
  const size = TIER_SIZE[p.sizeTier];
  const isHome = !!p.highlight;
  const session = sessionStatus(p, now);
  const sessionColor = SESSION_COLOR[session];

  // Label placement — use explicit labelDir or fallback to longitude rule
  const dir = p.labelDir ?? (p.lon > 90 ? "W" : "E");
  const { dx, dy, anchor, align } = labelOffset(dir, size.dot);

  // Two-line vs three-line based on tier
  const compact = p.sizeTier >= 3;
  const cityFont = compact ? size.label : size.label;
  const pctFont = size.pct;
  const tickerFont = size.label - 1;

  // Vertical stacking: city above pct above ticker
  const yCity   = y + dy + (align === "top" ? cityFont : align === "bottom" ? -(pctFont + (compact ? 0 : tickerFont + 4)) : -2);
  const yPct    = yCity + pctFont + 2;
  const yTicker = yPct + tickerFont + 2;

  return (
    <g
      onMouseEnter={() => setHover(p)}
      onMouseLeave={() => setHover(null)}
      style={{ cursor: "default" }}
    >
      {isHome && (
        <circle cx={x} cy={y} r={size.dot + 5}
          fill="none" stroke="var(--braun-yellow, #ffd000)"
          strokeWidth={1.2} opacity={0.85} />
      )}
      <circle cx={x} cy={y} r={size.dot + 2.5}
        fill="none" stroke={sessionColor}
        strokeWidth={1.4}
        opacity={session === "open" || session === "always-on" ? 0.9 : 0.4}
        strokeDasharray={session === "pre" || session === "post" ? "1.5 1.5" : undefined} />
      <circle cx={x} cy={y} r={size.dot}
        fill={vibeColor} stroke="var(--bg)" strokeWidth={0.8} />
      <circle cx={x} cy={y} r={size.dot + 14} fill="transparent" />

      {/* City label */}
      <text x={x + dx} y={yCity}
        fontFamily="var(--font-body)"
        fontSize={cityFont}
        fontWeight={isHome || p.sizeTier <= 2 ? 700 : 600}
        fill={isHome ? "var(--braun-yellow, #ffd000)" : "var(--ink)"}
        textAnchor={anchor}
        style={{ paintOrder: "stroke", stroke: "var(--bg)", strokeWidth: 3, strokeLinejoin: "round" }}>
        {p.city.toLowerCase()}
      </text>

      {/* Δ% */}
      <text x={x + dx} y={yPct}
        fontFamily="var(--font-mono)" fontSize={pctFont}
        fontWeight={700} fill={vibeColor}
        textAnchor={anchor}
        style={{ paintOrder: "stroke", stroke: "var(--bg)", strokeWidth: 3, strokeLinejoin: "round" }}>
        {p.changePct === null
          ? "—"
          : `${p.changePct >= 0 ? "+" : ""}${p.changePct.toFixed(2)}%`}
      </text>

      {/* Ticker line — only for tier 1/2 (saves vertical space on tight clusters) */}
      {!compact && (
        <text x={x + dx} y={yTicker}
          fontFamily="var(--font-mono)" fontSize={tickerFont}
          fill="var(--muted)" textAnchor={anchor}
          style={{ paintOrder: "stroke", stroke: "var(--bg)", strokeWidth: 3, strokeLinejoin: "round" }}>
          {p.indexLabel}
          <tspan dx={3} fill={sessionColor} fontSize={tickerFont - 1}>· {SESSION_LABEL[session]}</tspan>
        </text>
      )}

      {isHover && (
        <circle cx={x} cy={y} r={size.dot + 7}
          fill="none" stroke={vibeColor} strokeWidth={1.2} opacity={0.7} />
      )}

      {isHome && layer === "EQUITY" && foreignFlow && (
        <ForeignFlowArrow x={x} y={y} d20={foreignFlow.d20} />
      )}
    </g>
  );
}

// ─── Tooltip ────────────────────────────────────────────────

interface TooltipProps {
  hover: MarketPin;
  hoverHistory: HistoryPoint[];
  hoverTimeline: ReturnType<typeof multiTimeframe> | null;
  hoverMacro: typeof COUNTRY_MACRO[string] | null;
  hoverIsHome: boolean;
  foreignFlow?: { d5: number; d20: number };
  now: Date;
}

function Tooltip({ hover, hoverHistory, hoverTimeline, hoverMacro, hoverIsHome, foreignFlow, now }: TooltipProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: 10, right: 10,
        background: "var(--bg-surface)",
        border: `1px solid ${VIBE_COLOR[vibeOf(hover.changePct)]}`,
        padding: "10px 12px",
        minWidth: 260,
        maxWidth: 300,
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: "0.9rem" }}>{hover.flag}</span>
        <span className="t-body" style={{ fontWeight: 700, fontSize: "0.875rem" }}>{hover.city}</span>
        <span className="t-micro" style={{ color: "var(--muted)" }}>{hover.country}</span>
        {hoverIsHome && (
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "var(--braun-yellow, #ffd000)", letterSpacing: "0.14em", border: "1px solid var(--braun-yellow, #ffd000)", padding: "1px 5px" }}>HOME</span>
        )}
      </div>
      <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>
        {hover.indexLabel} · {hover.symbol}
      </div>
      <div className="t-mono" style={{ fontSize: "1.25rem", fontWeight: 700, color: VIBE_COLOR[vibeOf(hover.changePct)], marginTop: 6 }}>
        {hover.changePct === null
          ? "—"
          : `${hover.changePct >= 0 ? "+" : ""}${hover.changePct.toFixed(2)}%`}
      </div>
      {hover.price !== null && (
        <div className="t-mono" style={{ fontSize: "0.75rem", color: "var(--ink)", marginTop: 2 }}>
          {hover.price.toLocaleString()} {hover.unit ?? ""}
        </div>
      )}

      {hoverHistory.length > 1 && hoverTimeline && (
        <div style={{ marginTop: 8 }}>
          <svg width={240} height={36} viewBox="0 0 240 36" style={{ display: "block" }}>
            <path d={sparklinePoints(hoverHistory, 240, 36)}
              fill="none" stroke={VIBE_COLOR[vibeOf(hover.changePct)]} strokeWidth={1.2} />
          </svg>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginTop: 4 }}>
            <Tf label="1D"  v={hoverTimeline.d1} />
            <Tf label="5D"  v={hoverTimeline.d5} />
            <Tf label="MTD" v={hoverTimeline.mtd} />
            <Tf label="YTD" v={hoverTimeline.ytd} />
          </div>
          {hoverTimeline.high52 !== null && hoverTimeline.low52 !== null && hoverTimeline.pct52 !== null && (
            <div className="t-micro" style={{ color: "var(--muted)", marginTop: 4, lineHeight: 1.4 }}>
              6m range {hoverTimeline.low52.toLocaleString(undefined, { maximumFractionDigits: 2 })} – {hoverTimeline.high52.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              {" "}· at <span style={{ color: hoverTimeline.pct52 > 80 ? "var(--bear)" : hoverTimeline.pct52 < 20 ? "var(--bull)" : "var(--ink)" }}>{hoverTimeline.pct52.toFixed(0)}%</span>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
        <Pip label="session" value={SESSION_LABEL[sessionStatus(hover, now)]} color={SESSION_COLOR[sessionStatus(hover, now)]} />
        <Pip label="vibe"    value={VIBE_LABEL[vibeOf(hover.changePct)]} color={VIBE_COLOR[vibeOf(hover.changePct)]} />
        <Pip label="tier"    value={`${hover.sizeTier}`} color="var(--muted)" />
      </div>

      {hoverMacro && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
          <div className="t-micro" style={{ color: "var(--muted)", letterSpacing: "0.14em", marginBottom: 4 }}>
            {hover.country.toUpperCase()} MACRO
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 4 }}>
            <MacroRow label="GDP YoY"  value={`${hoverMacro.gdp >= 0 ? "+" : ""}${hoverMacro.gdp.toFixed(1)}%`} color={hoverMacro.gdp > 2 ? "var(--bull)" : hoverMacro.gdp < 0 ? "var(--bear)" : "var(--ink)"} />
            <MacroRow label="CPI"      value={`${hoverMacro.cpi.toFixed(1)}%`} color={hoverMacro.cpi > 4 ? "var(--bear)" : hoverMacro.cpi < 1 ? "var(--bull)" : "var(--ink)"} />
            <MacroRow label="Unemp."   value={`${hoverMacro.unemployment.toFixed(1)}%`} />
            <MacroRow label="Policy"   value={`${hoverMacro.policyRate.toFixed(2)}%`} />
            <MacroRow label="S&P"      value={hoverMacro.rating} />
          </div>
        </div>
      )}

      {hoverIsHome && foreignFlow && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
          <div className="t-micro" style={{ color: "var(--braun-yellow, #ffd000)", letterSpacing: "0.14em", marginBottom: 4 }}>
            FOREIGN NET FLOW
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Pip label="5d"  value={`${foreignFlow.d5  >= 0 ? "+" : ""}฿${foreignFlow.d5.toFixed(0)}M`}  color={foreignFlow.d5  >= 0 ? "var(--bull)" : "var(--bear)"} />
            <Pip label="20d" value={`${foreignFlow.d20 >= 0 ? "+" : ""}฿${foreignFlow.d20.toFixed(0)}M`} color={foreignFlow.d20 >= 0 ? "var(--bull)" : "var(--bear)"} />
          </div>
        </div>
      )}
    </div>
  );
}

function BankTooltip({ bank }: { bank: typeof CENTRAL_BANKS[number] }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 10, right: 10,
        background: "var(--bg-surface)",
        border: `1px solid ${STANCE_COLOR[bank.stance]}`,
        padding: "10px 12px",
        minWidth: 240,
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: "0.9rem" }}>{bank.flag}</span>
        <span className="t-body" style={{ fontWeight: 700, fontSize: "0.875rem" }}>{bank.bank}</span>
      </div>
      <div className="t-mono" style={{ fontSize: "1.5rem", fontWeight: 700, color: STANCE_COLOR[bank.stance], marginTop: 6 }}>
        {bank.rate.toFixed(2)}%
      </div>
      <div className="t-micro" style={{ color: STANCE_COLOR[bank.stance], letterSpacing: "0.14em", marginTop: 2 }}>
        {bank.stance.toUpperCase()}
      </div>
      <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>
        <strong style={{ color: "var(--ink)" }}>{moveLabel(bank)}</strong> on {bank.lastMove}
      </div>
      <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>
        Next meeting: <span style={{ color: "var(--ink)" }}>{bank.nextMeeting}</span>
        {daysUntil(bank.nextMeeting) >= 0 && (
          <span style={{ color: "var(--caution)", marginLeft: 6 }}>in {daysUntil(bank.nextMeeting)}d</span>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
      <span className="t-micro" style={{ color: "var(--muted)" }}>{label}</span>
      <span className="t-mono" style={{ fontSize: "0.75rem", fontWeight: 700, color }}>{value}</span>
    </span>
  );
}

function Pip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
      <span className="t-micro" style={{ color: "var(--muted)" }}>{label}</span>
      <span className="t-mono" style={{ fontSize: "0.6875rem", fontWeight: 700, color }}>{value}</span>
    </span>
  );
}

function Tf({ label, v }: { label: string; v: number | null }) {
  const color = v === null ? "var(--muted)" : v >= 0 ? "var(--bull)" : "var(--bear)";
  return (
    <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)", padding: "4px 6px", textAlign: "center" }}>
      <div className="t-micro" style={{ color: "var(--muted)", fontSize: "0.5625rem" }}>{label}</div>
      <div className="t-mono" style={{ fontSize: "0.6875rem", fontWeight: 700, color }}>
        {v === null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`}
      </div>
    </div>
  );
}

function MacroRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
      <span className="t-micro" style={{ color: "var(--muted)" }}>{label}</span>
      <span className="t-mono" style={{ fontSize: "0.6875rem", fontWeight: 700, color: color ?? "var(--ink)" }}>{value}</span>
    </div>
  );
}

function ForeignFlowArrow({ x, y, d20 }: { x: number; y: number; d20: number }) {
  const inflow = d20 >= 0;
  const color = inflow ? "var(--bull)" : "var(--bear)";
  const arrowY = inflow ? y - 14 : y + 14;
  const triPath = inflow
    ? `M ${x - 4} ${arrowY + 5} L ${x + 4} ${arrowY + 5} L ${x} ${arrowY - 3} Z`
    : `M ${x - 4} ${arrowY - 5} L ${x + 4} ${arrowY - 5} L ${x} ${arrowY + 3} Z`;
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={arrowY} stroke={color} strokeWidth={1.2} opacity={0.8} />
      <path d={triPath} fill={color} opacity={0.9} />
      <text x={x + 6} y={arrowY + (inflow ? -2 : 4)}
        fontFamily="var(--font-mono)" fontSize={7}
        fill={color} fontWeight={700}>
        FOREIGN
      </text>
    </g>
  );
}

function MacroCalendarStrip() {
  const upcoming = MACRO_CALENDAR
    .filter(e => eventDaysUntil(e.date) >= 0 && eventDaysUntil(e.date) <= 7)
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  if (upcoming.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "var(--bg-raised)",
        border: "1px solid var(--line)",
        padding: "6px 12px",
        overflowX: "auto",
        scrollbarWidth: "thin",
      }}
    >
      <span className="t-micro" style={{ color: "var(--ink)", letterSpacing: "0.18em", flexShrink: 0 }}>
        THIS WEEK
      </span>
      <div style={{ width: 1, height: 18, background: "var(--line)", flexShrink: 0 }} />
      <div style={{ display: "inline-flex", gap: 14, flex: 1, minWidth: 0 }}>
        {upcoming.map((e, i) => {
          const days = eventDaysUntil(e.date);
          const color = impactColor(e.impact);
          return (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", paddingRight: 4 }}
              title={`${e.event} · consensus ${e.consensus ?? "—"} · prior ${e.prior ?? "—"}`}>
              <span style={{ width: 6, height: 6, background: color, flexShrink: 0 }} />
              <span style={{ fontSize: "0.9rem" }}>{e.flag}</span>
              <span className="t-mono" style={{ fontSize: "0.625rem", color: "var(--muted)", letterSpacing: "0.08em" }}>
                {days === 0 ? "TODAY" : `${days}d`}
              </span>
              <span className="t-body" style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--ink)" }}>
                {e.event}
              </span>
              {e.consensus && <span className="t-mono" style={{ fontSize: "0.625rem", color }}>{e.consensus}</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── FlightOverlay — renders military aircraft over the split-panel map ──

function lonToXGlobal(lon: number, totalWidth: number): number {
  return ((lon + 180) / 360) * totalWidth;
}
function latToYGlobal(lat: number, totalHeight: number): number {
  return ((90 - lat) / 180) * totalHeight;
}

function FlightOverlay({
  flights,
  loading,
  hover,
  setHover,
}: {
  flights: MilitaryFlight[];
  loading: boolean;
  hover: MilitaryFlight | null;
  setHover: (f: MilitaryFlight | null) => void;
}) {
  // Render as an absolutely-positioned SVG over the whole map area
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "var(--bg-raised)",
            border: "1px solid var(--line)",
            padding: "8px 14px",
            fontFamily: "var(--font-mono)",
            fontSize: "0.625rem",
            color: "var(--muted)",
            letterSpacing: "0.14em",
          }}
        >
          FETCHING OPENSKY…
        </div>
      )}

      <svg
        width="100%"
        height="100%"
        style={{ display: "block", overflow: "visible" }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {flights.filter(f => !f.onGround).map(f => {
          // Map lat/lon to SVG 0–100 coordinates
          const x = ((f.lon + 180) / 360) * 100;
          const y = ((90 - f.lat) / 180) * 100;
          const headingRad = ((f.heading ?? 0) - 90) * (Math.PI / 180);
          const isUS   = f.flag === "🇺🇸";
          const isCN   = f.flag === "🇨🇳";
          const isHome = f.flag === "🇹🇭";
          const color  = isUS ? "var(--tech)" : isCN ? "var(--bear)" : isHome ? "var(--braun-yellow, #ffd000)" : "var(--caution)";
          const isHovered = hover?.icao24 === f.icao24;

          // Triangle pointing in direction of travel
          const size = isHovered ? 2.2 : 1.5;
          const tip = { x: x + size * Math.cos(headingRad), y: y + size * Math.sin(headingRad) };
          const left = { x: x + size * 0.6 * Math.cos(headingRad + 2.4), y: y + size * 0.6 * Math.sin(headingRad + 2.4) };
          const right = { x: x + size * 0.6 * Math.cos(headingRad - 2.4), y: y + size * 0.6 * Math.sin(headingRad - 2.4) };

          return (
            <g
              key={f.icao24}
              style={{ pointerEvents: "auto", cursor: "default" }}
              onMouseEnter={() => setHover(f)}
              onMouseLeave={() => setHover(null)}
            >
              <polygon
                points={`${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`}
                fill={color}
                stroke="var(--bg)"
                strokeWidth={0.2}
                opacity={isHovered ? 1 : 0.85}
              />
              {/* Hit area */}
              <circle cx={x} cy={y} r={2} fill="transparent" />
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hover && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "var(--bg-surface)",
            border: "1px solid var(--caution)",
            padding: "8px 12px",
            minWidth: 240,
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: "0.9rem" }}>{hover.flag}</span>
            <span className="t-mono" style={{ fontWeight: 700, fontSize: "0.875rem" }}>{hover.callsign}</span>
            <span className="t-micro" style={{ color: "var(--muted)" }}>{hover.country}</span>
          </div>
          <div className="t-body" style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--caution)", marginTop: 4 }}>
            {hover.label}
          </div>
          <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2, lineHeight: 1.5 }}>
            {hover.significance}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            {hover.altitude_m !== null && (
              <span className="t-mono" style={{ fontSize: "0.6875rem", color: "var(--ink)" }}>
                {(hover.altitude_m / 1000).toFixed(1)} km ASL
              </span>
            )}
            {hover.velocity_ms !== null && (
              <span className="t-mono" style={{ fontSize: "0.6875rem", color: "var(--ink)" }}>
                {Math.round(hover.velocity_ms * 1.944)} kts
              </span>
            )}
            {hover.heading !== null && (
              <span className="t-mono" style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>
                HDG {hover.heading.toFixed(0)}°
              </span>
            )}
          </div>
          <div className="t-micro" style={{ color: "var(--dim)", marginTop: 6 }}>
            ICAO24 {hover.icao24} · {hover.source === "callsign" ? "callsign match" : "hex registry match"}
          </div>
          <div className="t-micro" style={{ color: "var(--dim)", marginTop: 2 }}>
            ADS-B only. EMCON aircraft not visible.
          </div>
        </div>
      )}
    </div>
  );
}

// Flight list panel — shown in the ticker strip when FLIGHTS layer is active
export function FlightListStrip({ flights }: { flights: MilitaryFlight[] }) {
  if (!flights.length) return null;
  return (
    <div style={{ display: "flex", gap: 18, padding: "6px 0", whiteSpace: "nowrap", overflowX: "auto" }}>
      {flights.slice(0, 20).map(f => (
        <span key={f.icao24} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: "0.8rem" }}>{f.flag}</span>
          <span className="t-mono" style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--caution)" }}>{f.callsign}</span>
          <span className="t-micro" style={{ color: "var(--muted)" }}>{f.label.split(" ")[0]}</span>
        </span>
      ))}
    </div>
  );
}
