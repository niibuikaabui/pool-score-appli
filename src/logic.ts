import type { GameState, GameSnapshot, PointValue, RackShot } from './types'

export const PLAYER_COLORS = [
  { bg: '#F2E4DC', btnBg: '#DCB8A3', accent: '#B5623A', text: '#4A2A18', subtext: '#7A4527', dash: [] },
  { bg: '#E3EAE3', btnBg: '#B9CDB8', accent: '#5E8267', text: '#26392A', subtext: '#42624A', dash: [6,3] },
  { bg: '#F1E8D6', btnBg: '#D9C291', accent: '#AD8434', text: '#4A3717', subtext: '#7A5C24', dash: [2,2] },
  { bg: '#E9E2EE', btnBg: '#C9B6D6', accent: '#7C5C9E', text: '#352640', subtext: '#5A4470', dash: [8,3,2,3] },
  { bg: '#E1E8EE', btnBg: '#AFC4D6', accent: '#4A7396', text: '#1E2E3B', subtext: '#36556D', dash: [4,4] },
  { bg: '#F0E2E6', btnBg: '#D9AEBC', accent: '#A0566E', text: '#3F1B26', subtext: '#6B3548', dash: [10,3] },
]

export const POINT_LABELS: Record<PointValue, string> = { 1: '①', 2: '②', 4: '④' }

export function createInitialState(playerNames: string[], pointBall = 5, finalBall: 9 | 10 = 9): GameState {
  const players = playerNames.map((name, id) => ({ id, name, score: 0 }))
  return {
    players,
    turnOrder: players.map((_, i) => i),
    currentPlayerIdx: 0,
    rackNumber: 1,
    turnCountInRack: 1,
    rackShots: [],
    history: [],
    finished: false,
    pointBall,
    finalBall,
  }
}

export function snapshot(state: GameState): GameSnapshot {
  return {
    players: state.players.map(p => ({ ...p })),
    turnOrder: [...state.turnOrder],
    currentPlayerIdx: state.currentPlayerIdx,
    rackNumber: state.rackNumber,
    turnCountInRack: state.turnCountInRack,
    rackShots: state.rackShots.map(s => ({ ...s })),
    history: [...state.history],
  }
}

export function restoreSnapshot(state: GameState, snap: GameSnapshot): GameState {
  return {
    ...state,
    players: snap.players.map(p => ({ ...p })),
    turnOrder: [...snap.turnOrder],
    currentPlayerIdx: snap.currentPlayerIdx,
    rackNumber: snap.rackNumber,
    turnCountInRack: snap.turnCountInRack,
    rackShots: snap.rackShots.map(s => ({ ...s })),
    history: [...snap.history],
  }
}

// ゼロサム得点付与
export function applyShot(state: GameState, pointValue: PointValue): GameState {
  const active = state.players
  const currentIdx = state.currentPlayerIdx
  const newPlayers = state.players.map((p, i) => {
    if (i === currentIdx) {
      return { ...p, score: p.score + pointValue * (active.length - 1) }
    }
    return { ...p, score: p.score - pointValue }
  })
  const newShot: RackShot = { playerIdx: currentIdx, pointValue }
  return {
    ...state,
    players: newPlayers,
    rackShots: [...state.rackShots, newShot],
    history: [...state.history, { type: 'shot', playerIdx: currentIdx, pointValue }],
  }
}

// 手番を次のプレイヤーへ
export function passTurn(state: GameState): GameState {
  const pos = state.turnOrder.indexOf(state.currentPlayerIdx)
  const nextIdx = state.turnOrder[(pos + 1) % state.turnOrder.length]
  return {
    ...state,
    currentPlayerIdx: nextIdx,
    turnCountInRack: state.turnCountInRack + 1,
    history: [...state.history, { type: 'pass', fromIdx: state.currentPlayerIdx, toIdx: nextIdx }],
  }
}

// マスワリ可能かどうか判定
export function isMasuwariPossible(rackShots: RackShot[]): boolean {
  const scorers = new Set(rackShots.map(s => s.playerIdx))
  return scorers.size <= 1
}

// ラックの各プレイヤーの純増減点を計算
function calcRackDeltas(rackShots: RackShot[], playerCount: number): number[] {
  const deltas = Array(playerCount).fill(0)
  for (const shot of rackShots) {
    for (let i = 0; i < playerCount; i++) {
      if (i === shot.playerIdx) {
        deltas[i] += shot.pointValue * (playerCount - 1)
      } else {
        deltas[i] -= shot.pointValue
      }
    }
  }
  return deltas
}

// ラック終了（マスワリ有無を引数で受け取る）
export function endRack(state: GameState, masuwari: boolean): GameState {
  const playerCount = state.players.length
  const deltas = calcRackDeltas(state.rackShots, playerCount)

  // マスワリなら純増減点を2倍に修正してスコアに反映
  // （applyShot で既にスコアに加算済みなので、差分だけ追加）
  let newPlayers = state.players.map(p => ({ ...p }))
  if (masuwari) {
    newPlayers = newPlayers.map((p, i) => ({
      ...p,
      score: p.score + deltas[i], // delta分をもう1倍追加（合計2倍）
    }))
  }

  const finalDeltas = masuwari ? deltas.map(d => d * 2) : deltas

  return {
    ...state,
    players: newPlayers,
    rackNumber: state.rackNumber + 1,
    turnCountInRack: 1,
    rackShots: [],
    history: [
      ...state.history,
      { type: 'rack_end', rackNumber: state.rackNumber, masuwari, deltas: finalDeltas },
    ],
  }
}

// 打順変更
export function reorder(state: GameState, newTurnOrder: number[]): GameState {
  return {
    ...state,
    turnOrder: newTurnOrder,
    history: [...state.history, { type: 'reorder' }],
  }
}

// プレイヤー追加（ラック開始前のみ呼ぶこと）
export function addPlayer(state: GameState, name: string): GameState {
  const newId = state.players.length
  const newPlayer = { id: newId, name, score: 0 }
  return {
    ...state,
    players: [...state.players, newPlayer],
    turnOrder: [...state.turnOrder, newId],
    history: [...state.history, { type: 'player_added', playerName: name }],
  }
}

// このラックで得点ボタンか「次のプレイヤー」が1回でも押されたか
export function isRackInProgress(state: GameState): boolean {
  return state.rackShots.length > 0 || state.turnCountInRack > 1
}

// CSV生成
export function generateCsv(state: GameState): string {
  const headers = ['ラック', ...state.players.map(p => p.name + '_増減'), ...state.players.map(p => p.name + '_累計')]
  const rows: string[][] = []

  let cumulative = Array(state.players.length).fill(0)
  for (const event of state.history) {
    if (event.type === 'rack_end') {
      const deltas = event.deltas
      cumulative = cumulative.map((c, i) => c + deltas[i])
      rows.push([
        String(event.rackNumber) + (event.masuwari ? '(マスワリ)' : ''),
        ...deltas.map(String),
        ...cumulative.map(String),
      ])
    }
  }

  const lines = [headers.join(','), ...rows.map(r => r.join(','))]
  return lines.join('\n')
}

// ランダムシャッフル（直前と同じ配列にならないよう再抽選）
export function shuffleExceptCurrent(order: number[], currentIdx: number): number[] {
  const others = order.filter(i => i !== currentIdx)
  if (others.length < 2) return order
  let shuffled: number[]
  do {
    shuffled = [...others].sort(() => Math.random() - 0.5)
  } while (shuffled.every((v, i) => v === others[i]))
  return order.map(i => (i === currentIdx ? currentIdx : shuffled.shift()!))
}
