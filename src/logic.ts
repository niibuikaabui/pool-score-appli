import type { GameState, GameSnapshot, PointValue, RackShot } from './types'

export const PLAYER_COLORS = [
  { bg: '#EEF0FF', btnBg: '#C7C9F9', accent: '#635BFF', text: '#312E81', subtext: '#4B45C6', dash: [] },
  { bg: '#E7F0FE', btnBg: '#B6D2F8', accent: '#2F7FED', text: '#1E3A8A', subtext: '#1D4ED8', dash: [6,3] },
  { bg: '#E2F5F1', btnBg: '#A7E0D5', accent: '#0E9384', text: '#134E48', subtext: '#107569', dash: [2,2] },
  { bg: '#E8F5E9', btnBg: '#AEDDB4', accent: '#1A8245', text: '#14532D', subtext: '#166534', dash: [8,3,2,3] },
  { bg: '#FBF1DD', btnBg: '#EAD2A0', accent: '#B7791F', text: '#713F12', subtext: '#92600E', dash: [4,4] },
  { bg: '#FCE9EE', btnBg: '#F3BACE', accent: '#E0356A', text: '#831843', subtext: '#BE185D', dash: [10,3] },
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
    freeSelect: false,
  }
}

// プレイヤーを選択（手番を直接切り替え。順番管理しないモードで使用）
export function selectPlayer(state: GameState, idx: number): GameState {
  return { ...state, currentPlayerIdx: idx }
}

// 順番回数を管理しないモードを有効化（一度ONにすると戻せない）
export function enableFreeSelect(state: GameState): GameState {
  return { ...state, freeSelect: true }
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
