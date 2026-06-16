export type StatKey = 'health' | 'hunger' | 'thirst' | 'wood' | 'stone'

export interface GameState {
  health: number
  hunger: number
  thirst: number
  wood: number
  stone: number
  turn: number
  isGameOver: boolean
  logs: LogEntry[]
}

export interface LogEntry {
  id: number
  text: string
  type: 'action' | 'event' | 'system' | 'good' | 'bad'
  turn: number
}

export type LogType = LogEntry['type']

export interface RandomEvent {
  id: string
  text: string
  type: 'good' | 'bad' | 'neutral'
  effects: ActionEffect
}

export type ActionType = 'gatherWood' | 'gatherStone' | 'hunt' | 'drink'

export interface ActionEffect {
  health?: number
  hunger?: number
  thirst?: number
  wood?: number
  stone?: number
}

export interface ActionDefinition {
  type: ActionType
  name: string
  effects: ActionEffect
}

export interface StatRule {
  key: StatKey
  min: number
  max: number
  clamp: boolean
  canBeNegative: boolean
}

export interface EffectResult {
  success: boolean
  effects: ActionEffect
  logs: Array<{ text: string; type: LogType }>
}

export type EffectValidator = (state: GameState, effects: ActionEffect) => boolean
export type EffectApplier = (state: GameState, effects: ActionEffect) => void
export type GameOverChecker = (state: GameState) => boolean
