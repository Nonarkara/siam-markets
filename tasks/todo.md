# Design Token Compliance Sweep

## Why this matters
The app has 3 themes (dark default, light, inverted). Hardcoded hex values render
the same colour in every theme — token variables swap correctly. Every `#hex` in a
component file is a theme regression. This sweep makes the entire app theme-aware.

## Phase 1 — Zero-tolerance violations (glow effects, decorative gradients)
- [x] PatternResonance.tsx — remove textShadow, boxShadow glow; replace linear-gradient bar fill with solid; replace #hex → var(--token)
- [x] NarrativeReality.tsx — remove textShadow glow; replace tone-bar gradient
- [x] FlowMatrix.tsx — remove boxShadow glow; replace #hex → var(--token)
- [x] ThailandPanel.tsx — remove decorative gradient header tint
- [x] DigitalEconomyPanel.tsx — remove decorative gradient header tint
- [x] TerminalChart.tsx — remove repeating-linear-gradient scanlines overlay

## Phase 2 — Hardcoded color → design token (high-violation files first)
- [x] WorldMarketsMap.tsx
- [x] WorldMarketClock.tsx
- [x] FearGreedDial.tsx
- [x] SignalGraph.tsx + SignalWeb/index.tsx
- [x] PerfectPortfolio.tsx
- [x] TVWall.tsx + TVChannelStrip.tsx + LiveTVGrid.tsx + TrendsPanel.tsx
- [x] CorrelationMatrix.tsx
- [x] ForecastChart.tsx
- [x] AnomalyStream.tsx
- [x] PortfolioStatement.tsx + PortfolioTracker.tsx
- [x] SignalCard.tsx
- [x] SubwayStatusBar.tsx
- [x] GDPGrowthChart.tsx
- [x] FinancialHealth.tsx
- [x] AnalysisPanel.tsx
- [x] GistdaSectorPanel.tsx + SentinelPanel.tsx
- [x] StockCompareTool.tsx
- [x] Page files (money/page, plan/page, setup/page, trade/page, page.tsx)

## Phase 3 — type-check + build + deploy
- [ ] npm run type-check
- [ ] npm run build
- [ ] npx @cloudflare/next-on-pages@latest
- [ ] wrangler pages deploy
