import type { Signal, CausalEdge, Chain, TraderProfile } from './types'

// SVG coordinate space: viewBox="0 0 760 450"
// Layer y-positions: 65 (macro) · 185 (market) · 310 (flow) · 415 (thai)
const ACTIVE_THRESHOLD = 0.4

export { ACTIVE_THRESHOLD }

export const SIGNALS: Signal[] = [
  // ── MACRO LAYER (y = 65) ─────────────────────────────────────────
  {
    id: 'fed', label: 'Fed Rate', sub: '5.25%', category: 'macro',
    x: 63, y: 65, value: -0.55,
    desc: 'Federal funds rate signals monetary tightness. Hawkish stance = USD strength + EM headwind.',
    traders: ['swing', 'value'],
  },
  {
    id: 'uscpi', label: 'US CPI', sub: '3.2%', category: 'macro',
    x: 183, y: 65, value: -0.3,
    desc: 'US consumer prices easing toward target but still above 2%. Delays Fed rate cuts.',
    traders: ['swing', 'value'],
  },
  {
    id: 'usgdp', label: 'US GDP', sub: '+2.4%', category: 'macro',
    x: 303, y: 65, value: 0.4,
    desc: 'US economic growth resilient. Supports USD, validates keeping Fed rates elevated longer.',
    traders: ['value'],
  },
  {
    id: 'chnpmi', label: 'China PMI', sub: '52.3', category: 'macro',
    x: 443, y: 65, value: 0.72,
    desc: 'China manufacturing expansion above 50. Primary driver of ASEAN trade and EM risk appetite.',
    traders: ['day', 'swing', 'value'],
  },
  {
    id: 'botrate', label: 'BOT Rate', sub: '2.50%', category: 'macro',
    x: 571, y: 65, value: 0.1,
    desc: 'Bank of Thailand policy rate stable. No hike pressure — supports domestic consumption.',
    traders: ['swing', 'value'],
  },
  {
    id: 'thcpi', label: 'Thai CPI', sub: '1.8%', category: 'macro',
    x: 695, y: 65, value: 0.2,
    desc: 'Thailand inflation below BOT target. No tightening trigger. Consumer-positive environment.',
    traders: ['value'],
  },

  // ── MARKET CONDITIONS LAYER (y = 185) ────────────────────────────
  {
    id: 'dxy', label: 'DXY', sub: '103.4', category: 'market',
    x: 70, y: 185, value: -0.65,
    desc: 'Strong USD index pressures all EM currencies and drains EM capital allocations.',
    traders: ['day', 'swing'],
  },
  {
    id: 'us10y', label: 'US 10Y', sub: '4.35%', category: 'market',
    x: 195, y: 185, value: -0.52,
    desc: 'Elevated US yields offer a risk-free alternative — pulling capital away from EM equities.',
    traders: ['swing', 'value'],
  },
  {
    id: 'vix', label: 'VIX', sub: '19.2', category: 'market',
    x: 335, y: 185, value: -0.42,
    desc: 'Fear gauge near 20. Borderline risk-off. Spike above 22 triggers full defensive positioning.',
    traders: ['day'],
  },
  {
    id: 'oil', label: 'Oil', sub: 'WTI $84', category: 'market',
    x: 465, y: 185, value: -0.3,
    desc: 'Higher oil raises Thai import costs and CPI. Net negative for Thailand as a net oil importer.',
    traders: ['swing', 'value'],
  },
  {
    id: 'gold', label: 'Gold', sub: '$2,310', category: 'market',
    x: 598, y: 185, value: 0.58,
    desc: 'Elevated gold signals institutional defensive positioning. Risk-off hedge actively in use.',
    traders: ['day', 'swing'],
  },

  // ── FLOW LAYER (y = 310) ─────────────────────────────────────────
  {
    id: 'emflow', label: 'EM Flows', sub: '−$2.1B', category: 'flow',
    x: 115, y: 310, value: -0.48,
    desc: 'EM fund outflows this week. Driven by strong DXY and yield differential vs US Treasuries.',
    traders: ['swing', 'value'],
  },
  {
    id: 'thbusd', label: 'THB/USD', sub: '35.4', category: 'flow',
    x: 285, y: 310, value: -0.28,
    desc: 'Baht slightly weaker — manageable, but acceleration above 36 would pressure SET.',
    traders: ['day', 'swing'],
  },
  {
    id: 'ffbuy', label: 'FX Flow', sub: '−฿3.2B', category: 'flow',
    x: 455, y: 310, value: -0.5,
    desc: 'Net foreign selling on SET this week. Domestic buyers absorbing pressure but cannot sustain.',
    traders: ['day', 'swing'],
  },
  {
    id: 'asean', label: 'ASEAN Sent.', sub: '↑ Positive', category: 'flow',
    x: 618, y: 310, value: 0.52,
    desc: 'ASEAN regional sentiment positive — China recovery spilling into regional trade flows.',
    traders: ['swing', 'value'],
  },

  // ── THAI MARKET LAYER (y = 415) ──────────────────────────────────
  {
    id: 'setmom', label: 'SET Mom.', sub: '−0.4%', category: 'thai',
    x: 115, y: 415, value: -0.44,
    desc: 'Short-term SET price momentum negative. Foreign selling and VIX elevation are the primary drags.',
    traders: ['day', 'swing'],
  },
  {
    id: 'sector', label: 'Sector Lead', sub: 'Defensive', category: 'thai',
    x: 285, y: 415, value: 0.46,
    desc: 'Defensive sectors (utilities, healthcare) clearly leading. Confirms risk-off internal rotation.',
    traders: ['swing', 'value'],
  },
  {
    id: 'breadth', label: 'Breadth', sub: '37% adv.', category: 'thai',
    x: 455, y: 415, value: -0.42,
    desc: 'Only 37% of SET stocks advancing. Narrow = fragile — one positive catalyst from reversal.',
    traders: ['day'],
  },
  {
    id: 'setvol', label: 'SET Vol.', sub: '±1.2%', category: 'thai',
    x: 618, y: 415, value: -0.35,
    desc: 'Elevated intraday swings. Signals indecision — wider stops required for any day trade.',
    traders: ['day'],
  },
]

export const EDGES: CausalEdge[] = [
  // Macro → Market
  { id: 'e1',  from: 'uscpi',   to: 'fed',    lag: 'weeks',   traders: ['swing','value'],  mechanism: 'Persistent inflation delays Fed rate cuts, keeps policy tight' },
  { id: 'e2',  from: 'usgdp',   to: 'fed',    lag: 'weeks',   traders: ['value'],           mechanism: 'Strong growth validates keeping rates elevated — no urgency to cut' },
  { id: 'e3',  from: 'fed',     to: 'dxy',    lag: 'instant', traders: ['swing','value'],  mechanism: 'Hawkish Fed attracts USD-denominated capital globally' },
  { id: 'e4',  from: 'fed',     to: 'us10y',  lag: 'days',    traders: ['swing','value'],  mechanism: 'Fed signals anchor long-end rate expectations' },
  { id: 'e5',  from: 'fed',     to: 'vix',    lag: 'days',    traders: ['day'],            mechanism: 'Policy uncertainty elevates equity risk premium' },
  { id: 'e6',  from: 'chnpmi',  to: 'oil',    lag: 'days',    traders: ['swing','value'],  mechanism: 'China expansion drives commodity import demand' },
  { id: 'e7',  from: 'oil',     to: 'thcpi',  lag: 'weeks',   traders: ['value'],           mechanism: 'Oil is Thailand\'s primary import inflation driver' },
  { id: 'e8',  from: 'thcpi',   to: 'botrate',lag: 'weeks',   traders: ['swing','value'],  mechanism: 'Low Thai CPI removes BOT rate hike trigger' },
  // Market → Flow
  { id: 'e9',  from: 'dxy',     to: 'emflow', lag: 'days',    traders: ['swing'],          mechanism: 'Strong USD raises EM debt service costs → capital outflows' },
  { id: 'e10', from: 'dxy',     to: 'thbusd', lag: 'instant', traders: ['day','swing'],    mechanism: 'USD strength directly weakens THB exchange rate' },
  { id: 'e11', from: 'us10y',   to: 'emflow', lag: 'days',    traders: ['swing','value'],  mechanism: '4%+ US yield competes with EM risk premium' },
  { id: 'e12', from: 'vix',     to: 'emflow', lag: 'instant', traders: ['day'],            mechanism: 'Elevated fear = EM allocation trimmed first by risk managers' },
  { id: 'e13', from: 'gold',    to: 'emflow', lag: 'days',    traders: ['day','swing'],    mechanism: 'Gold-bid = defensive institutional shift = EM reduced' },
  { id: 'e14', from: 'chnpmi',  to: 'asean',  lag: 'days',    traders: ['swing','value'],  mechanism: 'China activity drives ASEAN export and trade optimism' },
  { id: 'e15', from: 'botrate', to: 'thbusd', lag: 'days',    traders: ['swing'],          mechanism: 'BOT rate stability anchors baht expectations' },
  // Flow → Thai
  { id: 'e16', from: 'emflow',  to: 'ffbuy',  lag: 'days',    traders: ['swing'],          mechanism: 'EM outflow manifests as foreign selling on SET' },
  { id: 'e17', from: 'thbusd',  to: 'setmom', lag: 'days',    traders: ['day','swing'],    mechanism: 'THB weakness signals external selling pressure on SET' },
  { id: 'e18', from: 'ffbuy',   to: 'setmom', lag: 'instant', traders: ['day','swing'],    mechanism: 'Net foreign selling weighs directly on SET index' },
  { id: 'e19', from: 'ffbuy',   to: 'breadth',lag: 'days',    traders: ['day'],            mechanism: 'Concentrated foreign selling narrows advancing issues' },
  { id: 'e20', from: 'asean',   to: 'sector', lag: 'weeks',   traders: ['swing','value'],  mechanism: 'ASEAN optimism rotates into cyclical sector leadership' },
  { id: 'e21', from: 'asean',   to: 'setmom', lag: 'days',    traders: ['swing'],          mechanism: 'Regional positive sentiment partially offsets SET pressure' },
  // Thai internal
  { id: 'e22', from: 'setmom',  to: 'breadth',lag: 'days',    traders: ['day'],            mechanism: 'Momentum loss reduces the count of advancing stocks' },
  { id: 'e23', from: 'setmom',  to: 'setvol', lag: 'instant', traders: ['day'],            mechanism: 'Directional uncertainty inflates intraday swings' },
  { id: 'e24', from: 'vix',     to: 'setmom', lag: 'instant', traders: ['day'],            mechanism: 'Global fear gauge directly suppresses SET sentiment' },
  { id: 'e25', from: 'breadth', to: 'setvol', lag: 'days',    traders: ['day'],            mechanism: 'Narrow breadth = fragile structure = higher volatility' },
]

export const CHAINS: Chain[] = [
  {
    id: 'c1', chipLabel: 'FED → DXY → EM',
    label: 'Fed → DXY → EM Outflow → SET Selling',
    nodes: ['fed', 'dxy', 'emflow', 'ffbuy', 'setmom'],
    direction: 'bear', weight: 0.8, traders: ['swing', 'value'],
    insight: 'The primary bearish chain. Fed hawkishness drives USD strength, drains EM allocations, and manifests as foreign selling on SET.',
  },
  {
    id: 'c2', chipLabel: 'US10Y → EM → SELLING',
    label: 'US 10Y → EM Outflow → Foreign Selling',
    nodes: ['us10y', 'emflow', 'ffbuy'],
    direction: 'bear', weight: 0.65, traders: ['swing', 'value'],
    insight: 'Elevated US yields offer a risk-free 4%+ return — capital rotates out of EM equities into Treasuries.',
  },
  {
    id: 'c3', chipLabel: 'VIX → RISK-OFF → SET',
    label: 'VIX → Risk-Off → SET Pressure',
    nodes: ['vix', 'emflow', 'setmom'],
    direction: 'bear', weight: 0.5, traders: ['day'],
    insight: 'Near-20 VIX triggers EM allocation cuts by risk-managed funds. SET feels it the same session.',
  },
  {
    id: 'c4', chipLabel: 'GOLD → DEFENSIVE',
    label: 'Gold Bid → Defensive Shift → Narrow Breadth',
    nodes: ['gold', 'emflow', 'ffbuy', 'breadth'],
    direction: 'bear', weight: 0.45, traders: ['day', 'swing'],
    insight: 'Elevated gold signals institutional risk reduction. The defensive bid narrows the SET market breadth.',
  },
  {
    id: 'c5', chipLabel: 'CHINA → ASEAN → ROTATE',
    label: 'China PMI → ASEAN Optimism → Sector Rotation',
    nodes: ['chnpmi', 'asean', 'sector'],
    direction: 'bull', weight: 0.7, traders: ['swing', 'value'],
    insight: 'China expansion drives ASEAN trade optimism. Cyclical sectors with China exposure respond first.',
  },
  {
    id: 'c6', chipLabel: 'CHINA → SET SUPPORT',
    label: 'China PMI → ASEAN → Partial SET Support',
    nodes: ['chnpmi', 'asean', 'setmom'],
    direction: 'bull', weight: 0.42, traders: ['swing'],
    insight: 'Regional optimism cushions the SET decline. China-linked names outperform the broader market.',
  },
]

export const TRADER_PROFILES: Record<string, TraderProfile> = {
  day: {
    type: 'day',
    label: 'Day Trader',
    regime: 'RISK-OFF — WAIT',
    summary: 'VIX is borderline at 19.2 and foreign flow is net negative. SET breadth at 38% means most stocks aren\'t participating in bounces. The ±1.2% intraday volatility demands wider stops and reduces R:R on most setups. The macro pressure is real — wait for a catalyst: VIX drop below 18, or a sudden +฿1B+ foreign inflow session before entering momentum longs.',
    action: 'Wait for VIX < 18 or foreign inflow reversal. Fade intraday spikes with tight stops.',
  },
  swing: {
    type: 'swing',
    label: 'Swing Trader',
    regime: 'BEAR PRESSURE — ROTATE',
    summary: 'The Fed–DXY–EM chain is the dominant bearish thesis with all three nodes active. China PMI → ASEAN is the only live counter-weight, and it\'s not strong enough to reverse the flow. Net regime: mild bearish for broad SET. Defensive sectors (utilities, healthcare) are the correct rotation — they lead when risk-off is the dominant signal.',
    action: 'Rotate into SET defensives. Wait for DXY to roll over from 103 before adding cyclical exposure.',
  },
  value: {
    type: 'value',
    label: 'Value Investor',
    regime: 'ACCUMULATION WINDOW',
    summary: 'The bearish pressure is external and cycle-driven — Fed-cycle, DXY-cycle, yield-cycle — not a Thai fundamental deterioration. Domestic macro is intact: CPI 1.8%, BOT stable, and China PMI driving ASEAN recovery. This is the classic headwind environment that compresses valuations of quality companies without impairing their earnings power. The pain is a gift if you know what you\'re holding.',
    action: 'Accumulate quality SET names with China-ASEAN exposure at current compression. Ignore the daily noise.',
  },
}
