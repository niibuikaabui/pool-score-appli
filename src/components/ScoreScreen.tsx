import { useState, useEffect, useRef } from 'react'
import type { GameState, PointValue } from '../types'
import { PLAYER_COLORS, isMasuwariPossible, shuffleExceptCurrent, POINT_LABELS } from '../logic'
import { PlayerCard } from './PlayerCard'
import { HistoryPanel } from './HistoryPanel'
import { Modal, ModalActions, ModalButton } from './Modal'
import type { HistoryEvent } from '../types'

interface Props {
  state: GameState
  canUndo: boolean
  onShot: (v: PointValue) => void
  onPass: () => void
  onFinishRack: (masuwari: boolean) => void
  onChangeOrder: (order: number[]) => void
  onAddPlayer: (name: string) => void
  onFinishGame: () => void
  onUndo: () => void
}

const dangerBtn: React.CSSProperties = {
  background: '#F2E3E3',
  color: '#7A2E2E',
  border: '1.5px solid #B5453F',
}

type SettingsTab = 'order' | 'add' | 'history'

export function ScoreScreen({
  state, canUndo,
  onShot, onPass, onFinishRack, onChangeOrder, onAddPlayer, onFinishGame, onUndo,
}: Props) {
  const [showSettings, setShowSettings] = useState(false)
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('order')
  const [orderList, setOrderList] = useState<number[]>([])
  const [showMasuwari, setShowMasuwari] = useState(false)
  const [show10Rack, setShow10Rack] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [flashing, setFlashing] = useState(false)
  const prevRackRef = useRef(state.rackNumber)

  useEffect(() => {
    if (state.rackNumber !== prevRackRef.current) {
      prevRackRef.current = state.rackNumber
      setFlashing(true)
      setTimeout(() => setFlashing(false), 400)
    }
  }, [state.rackNumber])

  const openSettings = (tab: SettingsTab = 'order') => {
    setSettingsTab(tab)
    setOrderList([
      state.currentPlayerIdx,
      ...state.turnOrder.filter(i => i !== state.currentPlayerIdx),
    ])
    setShowSettings(true)
  }

  const closeSettings = () => {
    setShowSettings(false)
    setNewPlayerName('')
  }

  const moveUp = (pos: number) => {
    if (pos <= 0) return
    const next = [...orderList]
    ;[next[pos], next[pos - 1]] = [next[pos - 1], next[pos]]
    setOrderList(next)
  }

  const moveDown = (pos: number) => {
    if (pos >= orderList.length - 1) return
    const next = [...orderList]
    ;[next[pos], next[pos + 1]] = [next[pos + 1], next[pos]]
    setOrderList(next)
  }

  const handleAddConfirm = () => {
    const name = newPlayerName.trim() || `プレイヤー${state.players.length + 1}`
    onAddPlayer(name)
    setNewPlayerName('')
    closeSettings()
  }

  const currentColor = PLAYER_COLORS[state.currentPlayerIdx % PLAYER_COLORS.length]
  const rackInProgress = state.rackShots.length > 0 || state.turnCountInRack > 1
  const scorerCount = new Set(state.rackShots.map(s => s.playerIdx)).size
  const addDisabled = rackInProgress || state.players.length >= 6

  const rackDeltas = state.players.map((_, i) => {
    let delta = 0
    for (const shot of state.rackShots) {
      if (shot.playerIdx === i) delta += shot.pointValue * (state.players.length - 1)
      else delta -= shot.pointValue
    }
    return delta
  })

  const finishRackAndCheck = (masuwari: boolean) => {
    onFinishRack(masuwari)
    if (state.rackNumber % 10 === 0) setShow10Rack(true)
  }

  const handleNextRack = () => {
    if (scorerCount === 0) return
    if (isMasuwariPossible(state.rackShots)) setShowMasuwari(true)
    else finishRackAndCheck(false)
  }

  const tabStyle = (tab: SettingsTab): React.CSSProperties => ({
    flex: 1,
    background: 'transparent',
    border: 'none',
    borderBottom: settingsTab === tab ? '2px solid var(--color-text-info)' : '2px solid transparent',
    color: settingsTab === tab ? 'var(--color-text-info)' : 'var(--color-text-tertiary)',
    fontSize: 13,
    fontWeight: 500,
    padding: '8px 4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-primary)', padding: '0 0 16px', position: 'relative', overflow: 'hidden' }}>
      {flashing && (
        <div style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 100, animation: 'rack-flash 0.4s ease-out forwards', pointerEvents: 'none' }} />
      )}

      {/* トップバー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: 8, flexWrap: 'wrap', padding: '12px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 500 }}>ラック {state.rackNumber}</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', background: 'var(--color-background-secondary)', padding: '3px 9px', borderRadius: 999 }}>
            {state.turnCountInRack}人目
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => openSettings('order')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-settings" style={{ fontSize: 16 }} />設定
          </button>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="取り消し"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, padding: 0, border: 'none', background: 'transparent', color: 'var(--color-text-tertiary)', opacity: canUndo ? 1 : 0.3 }}
          >
            <i className="ti ti-arrow-back-up" style={{ fontSize: 16 }} />
          </button>
        </div>
      </div>

      {/* プレイヤーカード */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: '1rem', padding: '0 24px' }}>
        {state.turnOrder.map((playerIdx, order) => (
          <PlayerCard
            key={playerIdx}
            player={state.players[playerIdx]}
            colorIdx={playerIdx}
            isActive={playerIdx === state.currentPlayerIdx}
            rackShots={state.rackShots}
            rackDelta={rackDeltas[playerIdx]}
            order={order}
          />
        ))}
      </div>

      {/* 得点ボタン */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: '1rem', padding: '0 24px' }}>
        {([1, 2, 4] as PointValue[]).map(v => (
          <button
            key={v}
            onClick={() => onShot(v)}
            style={{ background: currentColor.btnBg, color: currentColor.text, border: 'none', borderRadius: 'var(--border-radius-md)', padding: '16px 0', fontSize: 20, fontWeight: 500 }}
          >
            +{v}
          </button>
        ))}
      </div>

      {/* 操作ボタン行 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 24px' }}>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            onClick={onPass}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px 0', fontSize: 15, fontWeight: 500, background: 'var(--color-text-tertiary)', color: '#fff', border: 'none' }}
          >
            <i className="ti ti-player-track-next" style={{ fontSize: 16 }} />次のプレイヤー
          </button>
          <button
            onClick={handleNextRack}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px 0', fontSize: 15, fontWeight: 500, background: 'var(--color-text-info)', color: '#fff', border: 'none', opacity: scorerCount === 0 ? 0.35 : 1, pointerEvents: scorerCount === 0 ? 'none' : 'auto', transition: 'opacity .15s' }}
          >
            <i className="ti ti-flag" style={{ fontSize: 16 }} />次のラック
          </button>
        </div>
      </div>

      {/* ゲーム終了ボタン（最下部） */}
      <div style={{ padding: '16px 24px 0' }}>
        <button onClick={() => setShowEndConfirm(true)} style={{ ...dangerBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '11px 0' }}>
          <i className="ti ti-square-rounded-x" style={{ fontSize: 16 }} />ゲーム終了
        </button>
      </div>

      {/* 設定モーダル */}
      {showSettings && (
        <Modal title="設定" onClose={closeSettings}>
          {/* タブ */}
          <div style={{ display: 'flex', borderBottom: '0.5px solid var(--color-border-tertiary)', margin: '0 -1.25rem 14px', padding: '0 1.25rem' }}>
            <button style={tabStyle('order')} onClick={() => setSettingsTab('order')}>
              <i className="ti ti-arrows-sort" style={{ fontSize: 14 }} />順番
            </button>
            <button
              style={{ ...tabStyle('add'), opacity: addDisabled ? 0.4 : 1, pointerEvents: addDisabled ? 'none' : 'auto' }}
              onClick={() => setSettingsTab('add')}
            >
              <i className="ti ti-user-plus" style={{ fontSize: 14 }} />追加
            </button>
            <button style={tabStyle('history')} onClick={() => setSettingsTab('history')}>
              <i className="ti ti-history" style={{ fontSize: 14 }} />履歴
            </button>
          </div>

          {/* 順番タブ */}
          {settingsTab === 'order' && (
            <div>
              <button
                onClick={() => setOrderList(shuffleExceptCurrent(orderList, state.currentPlayerIdx))}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10, fontSize: 13 }}
              >
                <i className="ti ti-arrows-shuffle" style={{ fontSize: 14 }} />ランダムに並び替え
              </button>
              <div style={{ marginBottom: 14 }}>
                {orderList.map((playerIdx, pos) => {
                  const player = state.players[playerIdx]
                  const c = PLAYER_COLORS[playerIdx % PLAYER_COLORS.length]
                  const isCurrent = playerIdx === state.currentPlayerIdx
                  return (
                    <div key={playerIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: c.accent, flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: 13, flex: 1 }}>
                        {player.name}{isCurrent && <span style={{ color: 'var(--color-text-tertiary)' }}> (手番中)</span>}
                      </span>
                      <button onClick={() => moveUp(pos)} disabled={pos === 0} style={{ padding: '2px 8px', opacity: pos === 0 ? 0.3 : 1 }}>
                        <i className="ti ti-chevron-up" style={{ fontSize: 14 }} />
                      </button>
                      <button onClick={() => moveDown(pos)} disabled={pos >= orderList.length - 1} style={{ padding: '2px 8px', opacity: pos >= orderList.length - 1 ? 0.3 : 1 }}>
                        <i className="ti ti-chevron-down" style={{ fontSize: 14 }} />
                      </button>
                    </div>
                  )
                })}
              </div>
              <ModalActions>
                <ModalButton onClick={() => { onChangeOrder(orderList); closeSettings() }} variant="primary">決定</ModalButton>
              </ModalActions>
            </div>
          )}

          {/* 追加タブ */}
          {settingsTab === 'add' && (
            <div>
              <input
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                placeholder={`プレイヤー${state.players.length + 1}`}
                style={{ width: '100%', marginBottom: 12 }}
                autoFocus
              />
              <ModalActions>
                <ModalButton onClick={handleAddConfirm} variant="primary">追加する</ModalButton>
              </ModalActions>
            </div>
          )}

          {/* 履歴タブ */}
          {settingsTab === 'history' && (
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {state.history.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', padding: '8px 0' }}>まだ記録がありません</div>
              )}
              {[...state.history].reverse().slice(0, 30).map((event: HistoryEvent, i) => {
                if (event.type === 'shot') {
                  const c = PLAYER_COLORS[event.playerIdx % PLAYER_COLORS.length]
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.accent, flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: 13, flex: 1 }}>{state.players[event.playerIdx]?.name} {POINT_LABELS[event.pointValue as PointValue]}</span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>ラック内</span>
                    </div>
                  )
                }
                if (event.type === 'pass') {
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-border-secondary)', flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: 13, flex: 1, color: 'var(--color-text-secondary)' }}>
                        {state.players[event.fromIdx]?.name} → {state.players[event.toIdx]?.name}
                      </span>
                    </div>
                  )
                }
                if (event.type === 'rack_end') {
                  const detail = event.deltas.map((d, pi) => `${state.players[pi]?.name ?? `P${pi+1}`} ${d > 0 ? '+' : ''}${d}`).join(' / ')
                  return (
                    <div key={i} style={{ padding: '6px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-text-primary)', flexShrink: 0, display: 'inline-block' }} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>
                          ラック{event.rackNumber} 終了{event.masuwari && <span style={{ color: '#AD8434' }}>・マスワリ!</span>}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2, paddingLeft: 16 }}>{detail}</div>
                    </div>
                  )
                }
                if (event.type === 'reorder') {
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-text-tertiary)', flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>打順を変更</span>
                    </div>
                  )
                }
                if (event.type === 'player_added') {
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-text-tertiary)', flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>「{event.playerName}」が参加</span>
                    </div>
                  )
                }
                return null
              })}
            </div>
          )}
        </Modal>
      )}

      {showMasuwari && (
        <Modal title="マスワリ確認" description="このラック、マスワリでしたか? はいの場合、増減点が2倍になります。">
          <ModalActions>
            <ModalButton onClick={() => { setShowMasuwari(false); finishRackAndCheck(false) }}>いいえ</ModalButton>
            <ModalButton onClick={() => { setShowMasuwari(false); finishRackAndCheck(true) }} variant="primary">はい (2倍)</ModalButton>
          </ModalActions>
        </Modal>
      )}

      {showEndConfirm && (
        <Modal title="ゲームを終了しますか?" description="この操作は元に戻せません。" onClose={() => setShowEndConfirm(false)}>
          <ModalActions>
            <ModalButton onClick={() => setShowEndConfirm(false)}>キャンセル</ModalButton>
            <ModalButton onClick={() => { onFinishGame(); setShowEndConfirm(false) }} variant="danger">終了する</ModalButton>
          </ModalActions>
        </Modal>
      )}

      {show10Rack && (
        <Modal title={`${state.rackNumber - 1}ラック終了`} description="現在の成績">
          <div style={{ marginBottom: 16 }}>
            {[...state.players]
              .sort((a, b) => b.score - a.score)
              .map((player, rank) => {
                const c = PLAYER_COLORS[player.id % PLAYER_COLORS.length]
                return (
                  <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: c.bg, borderRadius: 'var(--border-radius-md)', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: c.subtext, width: 16 }}>{rank + 1}</span>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.accent, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: c.text }}>{player.name}</span>
                    <span style={{ fontSize: 20, fontWeight: 500, color: c.text }}>{player.score}</span>
                  </div>
                )
              })}
          </div>
          <ModalActions>
            <ModalButton onClick={() => { setShow10Rack(false); onUndo() }}>キャンセル</ModalButton>
            <ModalButton onClick={() => setShow10Rack(false)} variant="primary">続ける</ModalButton>
          </ModalActions>
        </Modal>
      )}
    </div>
  )
}
