'use client'

import { useState, useMemo } from 'react'
import type { Trader } from './types'
import { SIGNALS, EDGES, ACTIVE_THRESHOLD } from './data'

const CAT_COLOR: Record<string, string> = {
  macro:  '#007aff',
  market: '#888884',
  flow:   '#ff9500',
  thai:   '#00c896',
}
const AMBER = '#ffd000'

function isActive(value: number) { return Math.abs(value) >= ACTIVE_THRESHOLD }

function edgePath(x1: number, y1: number, x2: number, y2: number): string {
  if (y1 === y2) {
    // Same-row arc
    const mx = (x1 + x2) / 2
    return `M ${x1} ${y1} Q ${mx} ${y1 - 24} ${x2} ${y2}`
  }
  // Cross-row S-curve: control points at 50% of the vertical distance
  const cy = y1 + (y2 - y1) * 0.5
  return `M ${x1} ${y1} C ${x1} ${cy} ${x2} ${cy} ${x2} ${y2}`
}

const LAYERS = [
  { label: 'MACRO FUNDAMENTALS', textY: 30,  lineY: 44  },
  { label: 'MARKET CONDITIONS',  textY: 150, lineY: 164 },
  { label: 'CAPITAL FLOWS',      textY: 270, lineY: 284 },
  { label: 'THAI MARKET',        textY: 375, lineY: 389 },
]

interface Props {
  trader: Trader
  selectedSignal: string | null
  onSelect: (id: string | null) => void
}

export function SignalGraph({ trader, selectedSignal, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const focus = hovered ?? selectedSignal

  const connectedIds = useMemo(() => {
    if (!focus) return null
    const ids = new Set<string>([focus])
    EDGES.forEach(e => {
      if (e.from === focus) ids.add(e.to)
      if (e.to === focus) ids.add(e.from)
    })
    return ids
  }, [focus])

  function nodeOpacity(id: string, traders: Trader[]): number {
    const traderMatch = traders.includes(trader)
    if (!traderMatch) return 0.07
    if (!focus) return 1
    return connectedIds?.has(id) ? 1 : 0.1
  }

  function edgeVisible(fromTraders: Trader[]): boolean {
    return fromTraders.includes(trader)
  }

  function edgeStroke(edgeFrom: string, edgeTo: string, active: boolean): string {
    if (!focus) return active ? AMBER : '#2a2a2a'
    const bothConnected = connectedIds?.has(edgeFrom) && connectedIds?.has(edgeTo)
    return bothConnected ? AMBER : '#1a1a1a'
  }

  function edgeOpacity(edgeFrom: string, edgeTo: string): number {
    if (!focus) return 1
    return connectedIds?.has(edgeFrom) && connectedIds?.has(edgeTo) ? 0.9 : 0.05
  }

  return (
    <>
      <style>{`
        @keyframes sw-flowDash {
          from { stroke-dashoffset: 20; }
          to   { stroke-dashoffset: 0;  }
        }
        @keyframes sw-pulse {
          0%   { transform: scale(1);   opacity: 0.6; }
          70%  { transform: scale(2.6); opacity: 0;   }
          100% { transform: scale(2.6); opacity: 0;   }
        }
      `}</style>

      <svg
        viewBox="0 0 760 450"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        aria-label="Signal causation web"
      >
        {/* Layer labels + hairline dividers */}
        {LAYERS.map(layer => (
          <g key={layer.label}>
            <text
              x={4} y={layer.textY}
              fill="#3a3a36"
              fontFamily="IBM Plex Mono, monospace"
              fontSize={7.5}
              letterSpacing={1.4}
            >{layer.label}</text>
            <line x1={0} y1={layer.lineY} x2={760} y2={layer.lineY} stroke="#1f1f1f" strokeWidth={1} />
          </g>
        ))}

        {/* Edges — behind nodes */}
        {EDGES.map(edge => {
          if (!edgeVisible(edge.traders)) return null
          const from = SIGNALS.find(s => s.id === edge.from)!
          const to   = SIGNALS.find(s => s.id === edge.to)!
          const active = isActive(from.value) && isActive(to.value)
          const stroke = edgeStroke(edge.from, edge.to, active)
          const opacity = edgeOpacity(edge.from, edge.to)
          const path = edgePath(from.x, from.y, to.x, to.y)

          return (
            <path
              key={edge.id}
              d={path}
              fill="none"
              stroke={stroke}
              strokeWidth={active ? 1 : 0.8}
              opacity={opacity}
              strokeDasharray={active ? '4 7' : undefined}
              style={active ? { animation: 'sw-flowDash 0.9s linear infinite' } : undefined}
            />
          )
        })}

        {/* Nodes — on top of edges */}
        {SIGNALS.map(sig => {
          const active   = isActive(sig.value)
          const bull     = sig.value > 0
          const catColor = CAT_COLOR[sig.category]
          const sigColor = active ? (bull ? '#00c896' : '#ff3b30') : catColor
          const isFocus  = focus === sig.id
          const opacity  = nodeOpacity(sig.id, sig.traders)
          const labelBelow = sig.y > 380

          return (
            <g
              key={sig.id}
              transform={`translate(${sig.x},${sig.y})`}
              style={{ cursor: 'pointer', opacity, transition: 'opacity 200ms ease' }}
              onMouseEnter={() => setHovered(sig.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(selectedSignal === sig.id ? null : sig.id)}
              role="button"
              aria-label={sig.label}
            >
              {/* Pulse ring when active */}
              {active && (
                <circle
                  r={7}
                  fill="none"
                  stroke={sigColor}
                  strokeWidth={1}
                  style={{
                    transformOrigin: 'center',
                    animation: 'sw-pulse 2.5s ease-out infinite',
                  }}
                />
              )}

              {/* Focus halo */}
              {isFocus && (
                <circle r={12} fill="none" stroke={AMBER} strokeWidth={1} opacity={0.5} />
              )}

              {/* Node body */}
              <circle
                r={6}
                fill={isFocus ? `${AMBER}28` : active ? `${sigColor}20` : `${catColor}14`}
                stroke={isFocus ? AMBER : sigColor}
                strokeWidth={isFocus ? 1.5 : 1}
              />

              {/* Inner fill dot when active */}
              {active && <circle r={2.5} fill={sigColor} opacity={0.85} />}

              {/* Label */}
              <text
                y={labelBelow ? 20 : -13}
                textAnchor="middle"
                fill={isFocus ? AMBER : active ? sigColor : '#5a5a56'}
                fontFamily="IBM Plex Mono, monospace"
                fontSize={9}
                fontWeight={active ? 600 : 400}
                letterSpacing={0.6}
                style={{ pointerEvents: 'none' }}
              >{sig.label}</text>

              {/* Sub-label (current reading) */}
              <text
                y={labelBelow ? 30 : -3}
                textAnchor="middle"
                fill={isFocus ? `${AMBER}bb` : active ? `${sigColor}99` : '#2e2e2a'}
                fontFamily="IBM Plex Mono, monospace"
                fontSize={7.5}
                style={{ pointerEvents: 'none' }}
              >{sig.sub}</text>
            </g>
          )
        })}
      </svg>
    </>
  )
}
