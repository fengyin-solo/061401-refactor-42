import type {
  GameState,
  ActionType,
  ActionEffect,
  ActionDefinition,
  StatRule,
  StatKey,
  LogType,
  RandomEvent,
} from '@/types/game'
import { randomEvents } from '@/data/events'

const MAX_STAT = 100

export const STAT_RULES: Record<StatKey, StatRule> = {
  health: { key: 'health', min: 0, max: MAX_STAT, clamp: true, canBeNegative: false },
  hunger: { key: 'hunger', min: 0, max: MAX_STAT, clamp: true, canBeNegative: false },
  thirst: { key: 'thirst', min: 0, max: MAX_STAT, clamp: true, canBeNegative: false },
  wood: { key: 'wood', min: 0, max: MAX_STAT, clamp: false, canBeNegative: false },
  stone: { key: 'stone', min: 0, max: MAX_STAT, clamp: false, canBeNegative: false },
}

export const ACTIONS: Record<ActionType, ActionDefinition> = {
  gatherWood: {
    type: 'gatherWood',
    name: '采集木头',
    effects: { health: -5, hunger: 5, thirst: 3, wood: 10, stone: 0 },
  },
  gatherStone: {
    type: 'gatherStone',
    name: '采集石头',
    effects: { health: -8, hunger: 6, thirst: 4, wood: 0, stone: 8 },
  },
  hunt: {
    type: 'hunt',
    name: '打猎',
    effects: { health: 15, hunger: -20, thirst: 5, wood: -5, stone: 0 },
  },
  drink: {
    type: 'drink',
    name: '喝水',
    effects: { health: 0, hunger: 2, thirst: -25, wood: -3, stone: 0 },
  },
}

export function getStatRule(key: StatKey): StatRule {
  return STAT_RULES[key]
}

export function getActionDefinition(type: ActionType): ActionDefinition {
  return ACTIONS[type]
}

export function clampStat(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function validateEffects(state: GameState, effects: ActionEffect): boolean {
  const entries = Object.entries(effects) as [StatKey, number][]
  for (const [key, delta] of entries) {
    if (delta === undefined) continue
    const rule = getStatRule(key)
    if (!rule.canBeNegative && state[key] + delta < 0) {
      return false
    }
  }
  return true
}

export function applyEffectsToState(state: GameState, effects: ActionEffect): void {
  const entries = Object.entries(effects) as [StatKey, number][]
  for (const [key, delta] of entries) {
    if (delta === undefined) continue
    const rule = getStatRule(key)
    const newValue = state[key] + delta
    if (rule.clamp) {
      ;(state as any)[key] = clampStat(newValue, rule.min, rule.max)
    } else {
      ;(state as any)[key] = Math.max(rule.min, newValue)
    }
  }
}

export function checkGameOverCondition(state: GameState): boolean {
  return state.health <= 0 || state.hunger >= MAX_STAT || state.thirst >= MAX_STAT
}

export function getRandomEvent(): RandomEvent {
  const index = Math.floor(Math.random() * randomEvents.length)
  return randomEvents[index]
}

export function getEventLogType(event: RandomEvent): LogType {
  return event.type === 'good' ? 'good' : event.type === 'bad' ? 'bad' : 'event'
}

export function canPerformAction(state: GameState, action: ActionType): boolean {
  if (state.isGameOver) return false
  const definition = getActionDefinition(action)
  return validateEffects(state, definition.effects)
}
