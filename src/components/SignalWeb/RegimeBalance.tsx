'use client'

import type { Chain } from './types'
import { SIGNALS, CHAINS, ACTIVE_THRESHOLD } from './data'
import type { Trader } from './types'

function isChainActive(chain: Chain): boolean {
  return chain.nodes.every(id => {
    const sig = SIGNALS.find(s => s.id === id)
    return sig && Math.abs(sig.value) >= ACTIVE_THRESHOLD
  })
}

interface Props {
  trader: Trader
  regime: string
  regimeColor: string
}

export function RegimeBalance({ trader, regime, regimeColor }: Props) {
  const activeChains = CHAINS.filter(c =>
    isChainActive(c) && c.traders.some(t => t === trader)
  )

  const bearChains = activeChains.filter(c => c.direction === 'bear')
  const bullChains = activeChains.filter(c => c.direction === 'bull')

  // Score: weighted sum, normalized to -1..+1 range
  const rawScore = activeChains.reduce((acc, c) => {
    return acc + (c.direction === 'bull' ? c.weight : -c.weight)
  }, 0)
  const maxPossible = CHAINS
    .filter(c => c.traders.some(t => t === trader))
    .reduce((acc, c) => acc + c.weight, 0) || 1
  const score = Math.max(-1, Math.min(1, rawScore / maxPossible))

  // Translate score to % position on bar (center = 50%)
  const indicatorPct = 50 + score * 42

  return (
    <>
      <style>{`
        @keyframes sw-chipIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 8,
            letterSpacing: '0.14em',
            color: 'var(--dim)',
          }}>SIGNAL REGIME</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: regimeColor,
          }}>{regime}</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 8,
            color: 'var(--dim)',
            marginLeft: 'auto',
          }}>
            {bearChains.length}B · {bullChains.length}U active chains
          </span>
        </div>

        {/* Spectrum bar */}
        <div style={{ position: 'relative' }}>
          {/* BEAR / BULL axis labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 8,
              letterSpacing: '0.1em', color: 'var(--bear)',
            }}>◀ BEAR</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 8,
              letterSpacing: '0.1em', color: 'var(--muted)',
            }}>BALANCE</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 8,
              letterSpacing: '0.1em', color: 'var(--bull)',
            }}>BULL ▶</span>
          </div>

          {/* Hairline bar */}
          <div style={{
            position: 'relative',
            height: 2,
            background: 'var(--line)',
          }}>
            {/* Center tick */}
            <div style={{
              position: 'absolute',
              left: '50%',
              top: -4, bottom: -4,
              width: 1,
              background: 'var(--dim)',
            }} />
            {/* Position indicator */}
            <div style={{
              position: 'absolute',
              left: `${indicatorPct}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 8, height: 8,
              background: regimeColor,
              transition: 'left 0.7s cubic-bezier(0.23,1,0.32,1)',
            }} />
          </div>
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
          {bearChains.map((c, i) => (
            <div
              key={c.id}
              title={c.label + '\n\n' + c.insight}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                padding: '3px 8px',
                border: '1px solid var(--bear)',
                color: 'var(--bear)',
                letterSpacing: '0.06em',
                background: 'var(--bear-10)',
                animation: 'sw-chipIn 0.35s ease both',
                animationDelay: `${i * 0.1}s`,
                cursor: 'default',
              }}
            >{c.chipLabel}</div>
          ))}

          {bearChains.length > 0 && bullChains.length > 0 && (
            <div style={{ width: 1, height: 16, background: 'var(--line)', margin: '0 4px', flexShrink: 0 }} />
          )}

          {bullChains.map((c, i) => (
            <div
              key={c.id}
              title={c.label + '\n\n' + c.insight}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                padding: '3px 8px',
                border: '1px solid var(--bull)',
                color: 'var(--bull)',
                letterSpacing: '0.06em',
                background: 'var(--bull-10)',
                animation: 'sw-chipIn 0.35s ease both',
                animationDelay: `${(i + bearChains.length) * 0.1}s`,
                cursor: 'default',
              }}
            >{c.chipLabel}</div>
          ))}

          {activeChains.length === 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--dim)' }}>
              No active chains for this trader profile
            </span>
          )}
        </div>

        {/* Chain detail list */}
        {activeChains.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
            {activeChains.map(c => (
              <div
                key={c.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '10px 1fr',
                  gap: 10,
                  paddingLeft: 2,
                }}
              >
                <div style={{
                  width: 1,
                  background: c.direction === 'bear' ? 'var(--bear)' : 'var(--bull)',
                  opacity: 0.5,
                  alignSelf: 'stretch',
                }} />
                <div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: c.direction === 'bear' ? 'var(--bear)' : 'var(--bull)',
                    letterSpacing: '0.05em',
                    marginBottom: 2,
                  }}>{c.label}</div>
                  <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 11,
                    color: 'var(--muted)',
                    lineHeight: 1.5,
                  }}>{c.insight}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
