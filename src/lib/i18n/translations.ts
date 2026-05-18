/**
 * EN / TH translations for SIAM MARKETS.
 * Font: IBM Plex Sans Thai (non-looped) — already in font stack.
 * First-person: ผม only (§0 of CLAUDE.md).
 */

export type Lang = "en" | "th";

export const T = {
  // ─── Nav ─────────────────────────────────────────────────────
  nav_desk:      { en: "DESK",    th: "หน้าหลัก" },
  nav_markets:   { en: "MARKETS", th: "ตลาด" },
  nav_scan:      { en: "SCAN",    th: "สแกน" },
  nav_trade:     { en: "TRADE",   th: "เทรด" },
  nav_money:     { en: "MONEY",   th: "เงิน" },

  // ─── Home screen ─────────────────────────────────────────────
  set_index:     { en: "SET INDEX · LIVE", th: "ดัชนี SET · สด" },
  mr_market:     { en: "MR. MARKET", th: "คุณตลาด" },
  live_tv:       { en: "LIVE TV", th: "ทีวีสด" },
  signal_intel:  { en: "SIGNAL INTELLIGENCE", th: "สัญญาณ" },
  regional:      { en: "REGIONAL", th: "ภูมิภาค" },
  assets:        { en: "ASSETS", th: "สินทรัพย์" },
  recession_watch: { en: "RECESSION WATCH", th: "จับตาเศรษฐกิจ" },
  value_scanner: { en: "VALUE SCANNER — SET50", th: "หุ้นราคาถูก — SET50" },

  // ─── KPI labels ───────────────────────────────────────────────
  kpi_tax:       { en: "TAX DEDUCTION", th: "ลดหย่อนภาษี" },
  kpi_fg:        { en: "F&G SENTIMENT", th: "ความกลัว/โลภ" },
  kpi_set_pe:    { en: "SET P/E", th: "P/E ตลาด" },
  kpi_best_mos:  { en: "BEST MOS", th: "ส่วนต่างราคา" },
  on_target:     { en: "ON TARGET", th: "ตามเป้า" },

  // ─── Fear & Greed ─────────────────────────────────────────────
  fg_extreme_fear:  { en: "Extreme Fear — Buffett buys", th: "กลัวมาก — Buffett ซื้อ" },
  fg_fear:          { en: "Fear — discount zone", th: "กลัว — โซนส่วนลด" },
  fg_neutral:       { en: "Neutral — wait", th: "เฉยๆ — รอก่อน" },
  fg_greed:         { en: "Greed — be cautious", th: "โลภ — ระวัง" },
  fg_extreme_greed: { en: "Extreme Greed — lock gains", th: "โลภมาก — เก็บกำไร" },

  // ─── Scanner ─────────────────────────────────────────────────
  scan_title:    { en: "Scan", th: "สแกน" },
  scan_sub:      { en: "Graham/Buffett screen for SET50", th: "กรองหุ้น SET50 ด้วยหลัก Graham/Buffett" },
  graham_only:   { en: "Graham-Approved Only", th: "ผ่านเกณฑ์ Graham เท่านั้น" },
  tap_for_more:  { en: "Tap any row for full analysis", th: "แตะแถวเพื่อดูวิเคราะห์เต็ม" },

  // ─── Portfolio ────────────────────────────────────────────────
  portfolio_title: { en: "My Portfolio", th: "พอร์ตของผม" },
  total_value:     { en: "TOTAL VALUE", th: "มูลค่าทั้งหมด" },
  total_cost:      { en: "TOTAL COST", th: "ต้นทุนทั้งหมด" },
  total_pnl:       { en: "TOTAL P&L", th: "กำไร/ขาดทุน" },
  vs_benchmark:    { en: "vs SET", th: "เทียบ SET" },
  add_holding:     { en: "+ ADD HOLDING", th: "+ เพิ่มหุ้น" },
  add_fund:        { en: "+ ADD FUND", th: "+ เพิ่มกองทุน" },
  buy_price:       { en: "BUY PRICE", th: "ราคาซื้อ" },
  shares:          { en: "SHARES", th: "จำนวนหุ้น" },
  current_price:   { en: "CURRENT", th: "ราคาปัจจุบัน" },
  pnl:             { en: "P&L", th: "กำไร/ขาดทุน" },

  // ─── Money / Tax ──────────────────────────────────────────────
  money_title:     { en: "Money", th: "เงิน" },
  tax_calc:        { en: "TAX CALCULATOR", th: "คำนวณภาษี" },
  projection:      { en: "10-YEAR PROJECTION", th: "คาดการณ์ 10 ปี" },
  school:          { en: "INVESTMENT SCHOOL", th: "เรียนรู้การลงทุน" },
  annual_income:   { en: "Annual Income (THB)", th: "รายได้ต่อปี (บาท)" },
  tax_saved:       { en: "ESTIMATED TAX SAVINGS", th: "ประมาณการภาษีที่ประหยัดได้" },

  // ─── Signals ─────────────────────────────────────────────────
  sig_buy:    { en: "BUY",   th: "ซื้อ" },
  sig_watch:  { en: "WATCH", th: "จับตา" },
  sig_hold:   { en: "HOLD",  th: "ถือ" },
  sig_sell:   { en: "SELL",  th: "ขาย" },
  sig_info:   { en: "INFO",  th: "ข้อมูล" },
  do_action:  { en: "→ DO",  th: "→ ควรทำ" },

  // ─── Market status ────────────────────────────────────────────
  yield_normal:   { en: "NORMAL",   th: "ปกติ" },
  yield_flat:     { en: "FLAT",     th: "แบน" },
  yield_inverted: { en: "INVERTED", th: "กลับด้าน" },
  yield_steep:    { en: "STEEP",    th: "ชัน" },
  vix_calm:       { en: "CALM",     th: "สงบ" },
  vix_elevated:   { en: "ELEVATED", th: "สูง" },
  vix_panic:      { en: "PANIC",    th: "ตื่นตระหนก" },

  // ─── Share card ───────────────────────────────────────────────
  share_signal:   { en: "SHARE THIS SIGNAL", th: "แชร์สัญญาณนี้" },
  share_save:     { en: "SAVE IMAGE", th: "บันทึกภาพ" },
  built_in_th:    { en: "Built in Thailand", th: "สร้างในประเทศไทย" },
} as const;

export type TKey = keyof typeof T;

export function t(key: TKey, lang: Lang): string {
  return T[key][lang];
}
