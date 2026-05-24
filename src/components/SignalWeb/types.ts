export type Direction = 'bull' | 'bear' | 'neutral'
export type Category = 'macro' | 'market' | 'flow' | 'thai'
export type Trader = 'day' | 'swing' | 'value'

export interface Signal {
  id: string
  label: string
  sub: string
  category: Category
  x: number
  y: number
  value: number      // -1.0 strong bear → +1.0 strong bull
  desc: string
  traders: Trader[]
}

export interface CausalEdge {
  id: string
  from: string
  to: string
  mechanism: string
  lag: 'instant' | 'days' | 'weeks'
  traders: Trader[]
}

export interface Chain {
  id: string
  chipLabel: string
  label: string
  nodes: string[]
  direction: Direction
  weight: number
  traders: Trader[]
  insight: string
}

export interface TraderProfile {
  type: Trader
  label: string
  regime: string
  summary: string
  action: string
}
