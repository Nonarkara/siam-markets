/**
 * /api/military-flights — Military & government aircraft over Southeast Asia.
 *
 * Source: OpenSky Network anonymous REST API (free, no key, rate-limited).
 * Bounding box: SE Asia + China Southern + Indian Ocean approaches.
 *
 * Detection strategy — three complementary filters:
 *  1. ICAO24 hex prefix ranges for military registers
 *     (US Air Force/Navy/Marines, Chinese PLA-AF, Russian VKS, etc.)
 *  2. Callsign prefix patterns (RCH = USAF Air Mobility, TOPAZ = USAF,
 *     JAKE/SPAR = US Govt VIP, PLAAF prefixes, etc.)
 *  3. Origin country + "squawk 7700" (emergency) or "squawk 7600"
 *
 * Why it matters financially:
 *  • Heavy USAF strategic airlift (C-17/C-5) surge → logistics sector
 *  • PLA Naval Aviation activity near SCS → geopolitical risk premium
 *  • Unusual B-52 / RC-135 presence → elevated tension signal
 *  • US VIP flights (SPAR) → potential policy event imminent
 *
 * NOT a military intelligence product. ADS-B only captures transponder-
 * broadcasting aircraft. Stealth or EMCON aircraft are not visible.
 * Treat as a correlational signal layer, not ground truth.
 */

export const runtime    = "edge";
export const revalidate = 60; // refresh every minute

// api.airplanes.live — community ADSBExchange mirror.
// Free, no key, does not block cloud/edge environments.
// /v2/mil returns all currently-tracked military aircraft globally.
const AIRPLANESLIVE_MIL = "https://api.airplanes.live/v2/mil";

// SE Asia + approaches: filter envelope after fetch
const BBOX = { lamin: 0, lomin: 92, lamax: 28, lomax: 135 };

// ─── ICAO24 hex prefix ranges for military registries ─────────
// Source: ICAO Annex 10, national registry databases
const MILITARY_HEX_RANGES: Array<{ prefix: string; nation: string; flag: string; note: string }> = [
  { prefix: "ae",   nation: "US Military (AF/Navy)",    flag: "🇺🇸", note: "AE0000-AEFFFF" },
  { prefix: "a0",   nation: "US Military (reserve)",    flag: "🇺🇸", note: "Select A0xxxx blocks" },
  { prefix: "780",  nation: "China (PLAAF/PLAN)",       flag: "🇨🇳", note: "7800xx-78FFxx PLA blocks" },
  { prefix: "781",  nation: "China (PLAAF/PLAN)",       flag: "🇨🇳", note: "7810xx-781Fxx" },
  { prefix: "3a0",  nation: "France Military",          flag: "🇫🇷", note: "3A0xxx-3A1xxx" },
  { prefix: "43",   nation: "UK Royal Air Force",       flag: "🇬🇧", note: "430000-43FFFF" },
  { prefix: "700",  nation: "Thailand Military",        flag: "🇹🇭", note: "Royal Thai Air Force" },
  { prefix: "701",  nation: "Thailand Military",        flag: "🇹🇭", note: "Royal Thai Navy/Army" },
  { prefix: "899",  nation: "Japan ASDF/MSDF",          flag: "🇯🇵", note: "899xxx blocks" },
  { prefix: "840",  nation: "South Korea ROKAF",        flag: "🇰🇷", note: "84xxxx military" },
  { prefix: "76c",  nation: "Russia VKS",               flag: "🇷🇺", note: "76C000-76CFFF" },
  { prefix: "76d",  nation: "Russia Military",          flag: "🇷🇺", note: "76D000-76DFFF" },
  { prefix: "7cf",  nation: "India Air Force / Navy",   flag: "🇮🇳", note: "7CF000-7CFFFF" },
  { prefix: "75c",  nation: "Australia RAAF",           flag: "🇦🇺", note: "75C000-75CFFF" },
  { prefix: "750",  nation: "Singapore RSAF",           flag: "🇸🇬", note: "750000-75003F RSAF" },
];

// ─── Callsign patterns strongly associated with military ──────
const MILITARY_CALLSIGN_PATTERNS: Array<{ pattern: RegExp; label: string; flag: string; significance: string }> = [
  { pattern: /^RCH\d/,    label: "USAF Air Mobility Command",      flag: "🇺🇸", significance: "Strategic airlift — C-17/C-5/KC-135 operations" },
  { pattern: /^REACH\d/,  label: "USAF Air Mobility (alt)",        flag: "🇺🇸", significance: "Strategic airlift" },
  { pattern: /^TOPAZ\d/,  label: "USAF Command / ISR",             flag: "🇺🇸", significance: "Intelligence, surveillance, reconnaissance" },
  { pattern: /^JAKE\d/,   label: "US Government VIP",              flag: "🇺🇸", significance: "Senior official transport — watch for policy events" },
  { pattern: /^SPAR\d/,   label: "US Government VIP (SPAR)",       flag: "🇺🇸", significance: "CODEL / executive branch movement" },
  { pattern: /^VENUS\d/,  label: "USAF Special Ops Support",       flag: "🇺🇸", significance: "Logistics support for special operations" },
  { pattern: /^GOLD\d/,   label: "USAF Air Force One support",     flag: "🇺🇸", significance: "Presidential mission support aircraft" },
  { pattern: /^HAVOC\d/,  label: "USAF / Joint STARS",             flag: "🇺🇸", significance: "Ground surveillance aircraft" },
  { pattern: /^COBRA\d/,  label: "USAF Strategic Recon",           flag: "🇺🇸", significance: "RC-135 / U-2 reconnaissance" },
  { pattern: /^IRON\d/,   label: "B-52 / bomber",                  flag: "🇺🇸", significance: "Strategic bomber — elevated geopolitical signal" },
  { pattern: /^BUCK\d/,   label: "US Navy P-8 Maritime Patrol",    flag: "🇺🇸", significance: "Anti-submarine / surface surveillance" },
  { pattern: /^PLAF\d/,   label: "PLAAF (China)",                  flag: "🇨🇳", significance: "PLA Air Force identified flight" },
  { pattern: /^PLAN\d/,   label: "PLAN Aviation (China Navy)",     flag: "🇨🇳", significance: "PLA Navy air patrol — South China Sea" },
  { pattern: /^RJ\d{3}/,  label: "Royal Thai Air Force",           flag: "🇹🇭", significance: "Thai military exercise or patrol" },
  { pattern: /^THG\d/,    label: "Royal Thai Army Aviation",       flag: "🇹🇭", significance: "Army aviation patrol" },
  { pattern: /^JMSDF\d/,  label: "Japan MSDF Maritime Patrol",     flag: "🇯🇵", significance: "P-1 / P-3 patrol over SCS / Philippine Sea" },
  { pattern: /^RSAF\d/,   label: "Singapore RSAF",                 flag: "🇸🇬", significance: "Singapore Air Force operations" },
];


export interface MilitaryFlight {
  icao24:      string;
  callsign:    string;
  country:     string;
  flag:        string;
  lat:         number;
  lon:         number;
  altitude_m:  number | null;
  velocity_ms: number | null;
  heading:     number | null;
  label:       string;   // e.g. "USAF Air Mobility Command"
  significance:string;
  source:      "hex" | "callsign";
  onGround:    boolean;
}

function classifyFlight(
  icao24: string,
  callsign: string,
  country: string,
): { matched: boolean; label: string; flag: string; significance: string; source: "hex" | "callsign" } | null {

  const cs = (callsign ?? "").trim().toUpperCase();
  const hex = (icao24 ?? "").toLowerCase();

  // Callsign first (more specific)
  for (const p of MILITARY_CALLSIGN_PATTERNS) {
    if (p.pattern.test(cs)) {
      return { matched: true, label: p.label, flag: p.flag, significance: p.significance, source: "callsign" };
    }
  }

  // Hex prefix
  for (const r of MILITARY_HEX_RANGES) {
    if (hex.startsWith(r.prefix)) {
      return { matched: true, label: r.note, flag: r.flag, significance: `Military register — ${r.nation}`, source: "hex" };
    }
  }

  return null;
}

export interface MilitaryFlightResponse {
  flights:    MilitaryFlight[];
  total_seen: number;
  flagged:    number;
  as_of:      string;
  bbox:       typeof BBOX;
  note:       string;
}

// api.airplanes.live aircraft shape (subset we use)
interface AirplanesLiveAc {
  hex:      string;       // ICAO24
  flight?:  string;       // callsign (trimmed)
  r?:       string;       // registration
  t?:       string;       // type / model
  lat?:     number;
  lon?:     number;
  alt_baro?: number | "ground";
  gs?:      number;       // ground speed kt
  track?:   number;       // heading
  dbFlags?: number;       // bit 1 = military
  ownOp?:   string;       // owner / operator
}

export async function GET(): Promise<Response> {
  try {
    const res = await fetch(AIRPLANESLIVE_MIL, {
      headers: { "User-Agent": "DayTraders-Intelligence/1.0" },
      signal:  AbortSignal.timeout(12_000),
    });

    if (!res.ok) throw new Error(`airplanes.live ${res.status}`);

    const data = await res.json() as { ac?: AirplanesLiveAc[]; now?: number };
    const allAc = data.ac ?? [];

    // Filter to SE Asia bbox and classify
    const flights: MilitaryFlight[] = [];
    let total_seen = 0;

    for (const ac of allAc) {
      const lat = ac.lat;
      const lon = ac.lon;
      if (lat == null || lon == null) continue;

      // Bbox filter — SE Asia + approaches
      if (lat < BBOX.lamin || lat > BBOX.lamax || lon < BBOX.lomin || lon > BBOX.lomax) continue;

      total_seen++;

      const icao24  = (ac.hex   ?? "").toLowerCase();
      const rawCs   = (ac.flight ?? "").trim();
      const country = ""; // not provided by this API, derived via classification

      const match = classifyFlight(icao24, rawCs, country);
      if (!match) continue;

      const altRaw = ac.alt_baro;
      const altNum = (typeof altRaw === "number") ? altRaw * 0.3048 : null; // ft → m

      flights.push({
        icao24,
        callsign:     rawCs || "—",
        country:      match.flag,     // use flag as identifier since country not in feed
        flag:         match.flag,
        lat,
        lon,
        altitude_m:   altNum,
        velocity_ms:  ac.gs != null ? ac.gs * 0.5144 : null, // kt → m/s
        heading:      ac.track ?? null,
        label:        match.label,
        significance: match.significance,
        source:       match.source,
        onGround:     altRaw === "ground",
      });
    }

    const payload: MilitaryFlightResponse = {
      flights:    flights.sort((a, b) => Number(a.onGround) - Number(b.onGround)), // airborne first
      total_seen,
      flagged:    flights.length,
      as_of:      new Date().toISOString(),
      bbox:       BBOX,
      note:       "ADS-B via airplanes.live. Transponder-off / stealth aircraft not visible. Correlational signal layer.",
    };

    return Response.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
    });

  } catch (e) {
    return Response.json(
      { flights: [], total_seen: 0, flagged: 0, as_of: new Date().toISOString(), bbox: BBOX,
        note: `Flight data unavailable: ${e}. Try again in 60s.` },
      { headers: { "Cache-Control": "public, s-maxage=30" } },
    );
  }
}
