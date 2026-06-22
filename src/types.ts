export type PointValue = 1 | 2 | 4

export interface Player {
  id: number
  name: string
  score: number       // 累計持ち点
}

export type HistoryEventType =
  | 'shot'
  | 'pass'
  | 'rack_end'
  | 'reorder'
  | 'player_added'

export interface ShotEvent {
  type: 'shot'
  playerIdx: number
  pointValue: PointValue
}

export interface PassEvent {
  type: 'pass'
  fromIdx: number
  toIdx: number
}

export interface RackEndEvent {
  type: 'rack_end'
  rackNumber: number
  masuwari: boolean
  deltas: number[]    // 各プレイヤーのラック純増減点（マスワリ適用後）
}

export interface ReorderEvent {
  type: 'reorder'
}

export interface PlayerAddedEvent {
  type: 'player_added'
  playerName: string
}

export type HistoryEvent =
  | ShotEvent
  | PassEvent
  | RackEndEvent
  | ReorderEvent
  | PlayerAddedEvent

export interface RackShot {
  playerIdx: number
  pointValue: PointValue
}

export interface GameState {
  players: Player[]
  turnOrder: number[]
  currentPlayerIdx: number
  rackNumber: number
  turnCountInRack: number     // 「○人目」表示用（1始まり）
  rackShots: RackShot[]       // このラックの得点ログ
  history: HistoryEvent[]
  finished: boolean
  pointBall: number           // 点球の番号（デフォルト5）
  finalBall: 9 | 10           // 最終球
  freeSelect: boolean         // ラック内の順番回数を管理しないモード（一度ONにすると戻せない）
}

export interface GameSnapshot {
  players: Player[]
  turnOrder: number[]
  currentPlayerIdx: number
  rackNumber: number
  turnCountInRack: number
  rackShots: RackShot[]
  history: HistoryEvent[]
}
