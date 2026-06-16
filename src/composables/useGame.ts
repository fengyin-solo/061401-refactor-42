import { ref, computed } from 'vue'
import type { GameState, LogEntry, ActionType, LogType } from '@/types/game'
import {
  canPerformAction as engineCanPerformAction,
  getActionDefinition,
  applyEffectsToState,
  checkGameOverCondition,
  getRandomEvent,
  getEventLogType,
} from '@/composables/gameEngine'

const STORAGE_KEY_HIGH_SCORE = 'survival_game_high_score'

interface ActionContext {
  action: ActionType
  state: GameState
  logs: Array<{ text: string; type: LogType }>
}

type PipelineStep = (ctx: ActionContext) => boolean | void

export function useGame() {
  const state = ref<GameState>({
    health: 80,
    hunger: 30,
    thirst: 30,
    wood: 10,
    stone: 5,
    turn: 0,
    isGameOver: false,
    logs: [],
  })

  const highScore = ref<number>(0)
  let logIdCounter = 0

  const canAct = computed(() => !state.value.isGameOver)

  function loadHighScore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIGH_SCORE)
      if (saved) {
        highScore.value = parseInt(saved, 10) || 0
      }
    } catch (e) {
      highScore.value = 0
    }
  }

  function saveHighScore() {
    if (state.value.turn > highScore.value) {
      highScore.value = state.value.turn
      try {
        localStorage.setItem(STORAGE_KEY_HIGH_SCORE, String(highScore.value))
      } catch (e) {
        // ignore
      }
    }
  }

  function addLog(text: string, type: LogEntry['type'] = 'action') {
    state.value.logs.unshift({
      id: ++logIdCounter,
      text,
      type,
      turn: state.value.turn,
    })
    if (state.value.logs.length > 50) {
      state.value.logs.pop()
    }
  }

  function flushLogs(ctx: ActionContext) {
    for (const log of ctx.logs) {
      addLog(log.text, log.type)
    }
    ctx.logs = []
  }

  const validateStep: PipelineStep = (ctx) => {
    return canPerformAction(ctx.action)
  }

  const applyActionEffectsStep: PipelineStep = (ctx) => {
    const definition = getActionDefinition(ctx.action)
    applyEffectsToState(ctx.state, definition.effects)
    ctx.state.turn++
    ctx.logs.push({
      text: `第 ${ctx.state.turn} 回合：${definition.name}`,
      type: 'action',
    })
  }

  const triggerRandomEventStep: PipelineStep = (ctx) => {
    const event = getRandomEvent()
    applyEffectsToState(ctx.state, event.effects)
    ctx.logs.push({
      text: event.text,
      type: getEventLogType(event),
    })
  }

  const checkGameOverStep: PipelineStep = (ctx) => {
    if (checkGameOverCondition(ctx.state)) {
      ctx.state.isGameOver = true
      saveHighScore()
      ctx.logs.push({
        text: '你没能在荒野中生存下来...',
        type: 'system',
      })
    }
  }

  const actionPipeline: PipelineStep[] = [
    validateStep,
    applyActionEffectsStep,
    triggerRandomEventStep,
    checkGameOverStep,
  ]

  function executeActionPipeline(action: ActionType) {
    const ctx: ActionContext = {
      action,
      state: state.value,
      logs: [],
    }

    for (const step of actionPipeline) {
      const result = step(ctx)
      if (result === false) {
        return
      }
    }

    flushLogs(ctx)
  }

  function canPerformAction(action: ActionType): boolean {
    return engineCanPerformAction(state.value, action)
  }

  function performAction(action: ActionType) {
    executeActionPipeline(action)
  }

  function gatherWood() {
    performAction('gatherWood')
  }

  function gatherStone() {
    performAction('gatherStone')
  }

  function hunt() {
    performAction('hunt')
  }

  function drink() {
    performAction('drink')
  }

  function restart() {
    state.value = {
      health: 80,
      hunger: 30,
      thirst: 30,
      wood: 10,
      stone: 5,
      turn: 0,
      isGameOver: false,
      logs: [],
    }
    logIdCounter = 0
    addLog('你醒来发现自己身处荒野中，需要想办法生存下去...', 'system')
  }

  loadHighScore()
  addLog('你醒来发现自己身处荒野中，需要想办法生存下去...', 'system')

  return {
    state,
    highScore,
    canAct,
    canPerformAction,
    gatherWood,
    gatherStone,
    hunt,
    drink,
    restart,
  }
}
