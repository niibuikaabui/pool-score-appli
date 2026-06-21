import { useState, useCallback } from 'react'
import type { GameState, GameSnapshot, PointValue } from './types'
import {
  createInitialState,
  applyShot,
  passTurn,
  endRack,
  reorder,
  addPlayer,
  snapshot,
  restoreSnapshot,
} from './logic'

const STORAGE_KEY = 'pool_game_state'
const MAX_UNDO = 20

function loadFromStorage(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveToStorage(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

export function useGameState() {
  const [state, setState] = useState<GameState>(() => loadFromStorage() ?? createInitialState(['プレイヤー1', 'プレイヤー2', 'プレイヤー3']))
  const [undoStack, setUndoStack] = useState<GameSnapshot[]>([])

  const update = useCallback((newState: GameState) => {
    setState(newState)
    saveToStorage(newState)
  }, [])

  const pushUndo = useCallback((snap: GameSnapshot) => {
    setUndoStack(prev => [...prev.slice(-MAX_UNDO + 1), snap])
  }, [])

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev
      const snap = prev[prev.length - 1]
      const restored = restoreSnapshot(state, snap)
      setState(restored)
      saveToStorage(restored)
      return prev.slice(0, -1)
    })
  }, [state])

  const shot = useCallback((pointValue: PointValue) => {
    pushUndo(snapshot(state))
    update(applyShot(state, pointValue))
  }, [state, update, pushUndo])

  const pass = useCallback(() => {
    pushUndo(snapshot(state))
    update(passTurn(state))
  }, [state, update, pushUndo])

  const finishRack = useCallback((masuwari: boolean) => {
    pushUndo(snapshot(state))
    update(endRack(state, masuwari))
  }, [state, update, pushUndo])

  const changeOrder = useCallback((newOrder: number[]) => {
    pushUndo(snapshot(state))
    update(reorder(state, newOrder))
  }, [state, update, pushUndo])

  const addNewPlayer = useCallback((name: string) => {
    pushUndo(snapshot(state))
    update(addPlayer(state, name))
  }, [state, update, pushUndo])

  const finishGame = useCallback(() => {
    update({ ...state, finished: true })
  }, [state, update])

  const resetGame = useCallback((playerNames: string[], pointBall: number, finalBall: 9 | 10) => {
    const newState = createInitialState(playerNames, pointBall, finalBall)
    setUndoStack([])
    update(newState)
  }, [update])

  return {
    state,
    undoStack,
    shot,
    pass,
    finishRack,
    changeOrder,
    addNewPlayer,
    finishGame,
    resetGame,
    undo,
    canUndo: undoStack.length > 0,
  }
}
