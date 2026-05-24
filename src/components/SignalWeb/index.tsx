'use client'

import { useState } from 'react'
import { SignalGraph } from './SignalGraph'
import { RegimeBalance } from './RegimeBalance'
import { SIGNALS, EDGES, CHAINS, TRADER_PROFILES, ACTIVE_THRESHOLD } from './data'
import type { Trader } from './types'

const TRADER_TABS: { key: Trader; label: string; sub: string }[] = [
  { key: 'day',   label: 'DAY TRADER',     sub: 'Hours · momentum · flow' },
  { key: 'swing', label: 'SWING TRADER',   sub: 'Weeks · macro · rotation' },
  { key: 'value', label: 'VALUE INVESTOR', sub: 'Months · fundamentals' },
]

const CAT_LEGEND = [
  { color: '#007aff', label: 'MACRO' },
  { color: '#888884', label: 'MARKET' },
  { color: '#ff9500', label: 'FLOW' },
  { color: '#00c896', label: 'THAI' },
]

function computeRegimeColor(trader: Trader): string {
  const activeChains = CHAINS.filter(c => {
    const active = c.nodes.every(id => {
      const sig = SIGNALS.find(s => s.id === id)
      return sig && Math.abs(sig.value) >= ACTIVE_THRESHOLD
    })
    return active && c.traders.some(t => t === trader)
  })
  const bearW = activeChains.filter(c => c.direction === 'bear').reduce((a, c) => a + c.weight, 0)
  const bullW = activeChains.filter(c => c.direction === 'bull').reduce((a, c) => a + c.weight, 0)
  const net = bullW - bearW
  if (net > 0.15) return 'var(--bull)'
  if (net < -0.15) return 'var(--bear)'
  return 'var(--caution)'
}

export function SignalWeb() {
  const [trader, setTrader]   = useState<Trader>('swing')
  const [selected, setSelected] = useState<string | null>(null)

  const profile      = TRADER_PROFILES[trader]
  const regimeColor  = computeRegimeColor(trader)
  const selectedSig  = selected ? SIGNALS.find(s => s.id === selected) : null

  // Connected signals for the detail panel
  const connectedOut = selected
    ? EDGES.filter(e => e.from === selected).map(e => SIGNALS.find(s => s.id === e.to)!).filter(Boolean)
    : []
  const connectedIn = selected
    ? EDGES.filter(e => e.to === selected).map(e => SIGNALS.find(s => s.id === e.from)!).filter(Boolean)
    : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{
        padding: '20px 20px 0',
        borderBottom: '1px solid var(--line)',
        paddingBottom: 16,
      }}>
        <div style={{ marginBottom: 4 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-display)',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: 'var(--ink)',
          }}>SIGNAL WEB</span>
        </div>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-body)',
          color: 'var(--muted)',
          margin: 0,
          lineHeight: 1.5,
          maxWidth: 600,
        }}>
          Subtle signals connect through causation. When enough chain through the same thesis,
          they tip the balance — and the market reacts. Tap any node to trace its web.
        </p>
      </div>

      {/* ── Trader selector ────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--line)',
        overflowX: 'auto',
      }}>
        {TRADER_TABS.map(tab => {
          const active = trader === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => { setTrader(tab.key); setSelected(null) }}
              style={{
                flex: '0 0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                padding: '14px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: active ? '2px solid var(--braun-yellow)' : '2px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: 44,
                transition: 'border-color 180ms ease',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: active ? 700 : 400,
                letterSpacing: '0.08em',
                color: active ? 'var(--braun-yellow)' : 'var(--muted)',
              }}>{tab.label}</span>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: 10,
                color: active ? 'var(--dim)' : '#2e2e2a',
              }}>{tab.sub}</span>
            </button>
          )
        })}
      </div>

      {/* ── Main content ───────────────────────────────────────────── */}
      <div className="sw-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
        {/* Graph (desktop: 60% left column) */}
        <div
          className="sw-graph-pane"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--line)',
          }}
        >
          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
            {CAT_LEGEND.map(l => (
              <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 8,
                  letterSpacing: '0.1em',
                  color: 'var(--dim)',
                }}>{l.label}</span>
              </span>
            ))}
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
              <span style={{ width: 20, height: 1, borderTop: '1px dashed #ffd000', opacity: 0.7 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--dim)' }}>ACTIVE CHAIN</span>
            </span>
          </div>

          <SignalGraph trader={trader} selectedSignal={selected} onSelect={setSelected} />

          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 8,
            color: 'var(--dim)',
            marginTop: 8,
            letterSpacing: '0.06em',
          }}>
            TAP A NODE TO TRACE ITS CAUSAL CONNECTIONS
          </p>
        </div>

        {/* Right pane: detail + regime */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Selected signal detail */}
          {selectedSig ? (
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--line)',
              background: 'var(--bg-raised)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    fontWeight: 700,
                    color: Math.abs(selectedSig.value) >= ACTIVE_THRESHOLD
                      ? (selectedSig.value > 0 ? 'var(--bull)' : 'var(--bear)')
                      : 'var(--ink)',
                    letterSpacing: '0.06em',
                    marginBottom: 2,
                  }}>{selectedSig.label}</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--muted)',
                  }}>{selectedSig.sub}</div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    background: 'transparent', border: '1px solid var(--line)',
                    color: 'var(--dim)', cursor: 'pointer',
                    padding: '4px 10px', fontFamily: 'var(--font-mono)', fontSize: 9,
                    minHeight: 44, flexShrink: 0,
                  }}
                >CLOSE</button>
              </div>

              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: 'var(--muted)',
                lineHeight: 1.6,
                margin: '0 0 12px',
              }}>{selectedSig.desc}</p>

              {connectedIn.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--dim)', letterSpacing: '0.1em', marginBottom: 5 }}>
                    CAUSED BY
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {connectedIn.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelected(s.id)}
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9,
                          padding: '3px 8px',
                          border: '1px solid var(--line)',
                          color: 'var(--muted)',
                          background: 'transparent',
                          cursor: 'pointer',
                          letterSpacing: '0.05em',
                          minHeight: 28,
                        }}
                      >↑ {s.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {connectedOut.length > 0 && (
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--dim)', letterSpacing: '0.1em', marginBottom: 5 }}>
                    CAUSES
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {connectedOut.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelected(s.id)}
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9,
                          padding: '3px 8px',
                          border: '1px solid var(--line)',
                          color: 'var(--muted)',
                          background: 'transparent',
                          cursor: 'pointer',
                          letterSpacing: '0.05em',
                          minHeight: 28,
                        }}
                      >↓ {s.label}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Regime interpretation when no node selected */
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--line)',
              background: 'var(--bg-raised)',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 8,
                letterSpacing: '0.12em',
                color: 'var(--dim)',
                marginBottom: 8,
              }}>REGIME INTERPRETATION — {profile.label.toUpperCase()}</div>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: 'var(--muted)',
                lineHeight: 1.65,
                margin: '0 0 12px',
              }}>{profile.summary}</p>
              <div style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
                padding: '10px 12px',
                border: `1px solid ${regimeColor}44`,
                borderLeft: `3px solid ${regimeColor}`,
                background: 'var(--bg)',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--dim)', letterSpacing: '0.1em', flexShrink: 0, paddingTop: 2 }}>ACTION</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink)', lineHeight: 1.5 }}>{profile.action}</span>
              </div>
            </div>
          )}

          {/* Regime balance */}
          <div style={{ padding: '16px 20px' }}>
            <RegimeBalance
              trader={trader}
              regime={profile.regime}
              regimeColor={regimeColor}
            />
          </div>

        </div>
      </div>

      {/* ── Mobile chain list (supplement to graph) ─────────────────── */}
      <div className="sw-mobile-chains" style={{
        padding: '0 20px 20px',
        borderTop: '1px solid var(--line)',
        display: 'none',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 8,
          letterSpacing: '0.12em',
          color: 'var(--dim)',
          padding: '14px 0 10px',
        }}>ACTIVE CAUSAL CHAINS</div>
        {CHAINS.filter(c => c.traders.some(t => t === trader)).map(c => {
          const active = c.nodes.every(id => {
            const sig = SIGNALS.find(s => s.id === id)
            return sig && Math.abs(sig.value) >= ACTIVE_THRESHOLD
          })
          return (
            <div key={c.id} style={{
              display: 'flex',
              gap: 10,
              padding: '10px 0',
              borderBottom: '1px solid var(--line-dim)',
              opacity: active ? 1 : 0.3,
            }}>
              <div style={{
                width: 2,
                background: c.direction === 'bear' ? 'var(--bear)' : 'var(--bull)',
                flexShrink: 0,
              }} />
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: c.direction === 'bear' ? 'var(--bear)' : 'var(--bull)',
                  letterSpacing: '0.06em',
                  marginBottom: 4,
                }}>
                  {c.nodes.join(' → ')}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  color: 'var(--muted)',
                  lineHeight: 1.5,
                }}>{c.insight}</div>
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .sw-main-grid {
            grid-template-columns: 3fr 2fr !important;
          }
          .sw-graph-pane {
            border-bottom: none !important;
            border-right: 1px solid var(--line) !important;
          }
        }
        @media (max-width: 767px) {
          .sw-mobile-chains {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
