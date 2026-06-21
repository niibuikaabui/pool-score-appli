import { useState } from 'react'
import type { GameState, PointValue } from '../types'
import { PLAYER_COLORS, isMasuwariPossible } from '../logic'
import { PlayerCard } from './PlayerCard'
import { ReorderModal } from './ReorderModal'
import { HistoryPanel } from './HistoryPanel'
import { Modal, ModalActions, ModalButton } from './Modal'

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

const infoBtn: React.CSSProperties = {
  background: 'var(--color-background-info)',
  color: 'var(--color-text-info)',
  border: 'none',
}

const dangerBtn: React.CSSProperties = {
  background: '#F2E3E3',
  color: '#7A2E2E',
  border: '1.5px solid #B5453F',
}

export function ScoreScreen({
  state, canUndo,
  onShot, onPass, onFinishRack, onChangeOrder, onAddPlayer, onFinishGame, onUndo,
}: Props) {
  const [showReorder, setShowReorder] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showMasuwari, setShowMasuwari] = useState(false)
  const [show10Rack, setShow10Rack] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [showAddConfirm, setShowAddConfirm] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')

  const currentPlayer = state.players[state.currentPlayerIdx]
  const currentColor = PLAYER_COLORS[state.currentPlayerIdx % PLAYER_COLORS.length]
  const rackInProgress = state.rackShots.length > 0 || state.turnCountInRack > 1
  const scorerCount = new Set(state.rackShots.map(s => s.playerIdx)).size

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

  const handleAddConfirm = () => {
    const name = newPlayerName.trim() || `プレイヤー${state.players.length + 1}`
    onAddPlayer(name)
    setNewPlayerName('')
    setShowAddConfirm(false)
  }

  const addDisabled = rackInProgress || state.players.length >= 6

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-primary)', padding: '0 0 16px' }}>
      {/* トップバー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: 8, flexWrap: 'wrap', padding: '12px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 500 }}>ラック {state.rackNumber}</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', background: 'var(--color-background-secondary)', padding: '3px 9px', borderRadius: 999 }}>
            {state.turnCountInRack}人目
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setShowReorder(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-arrows-sort" style={{ fontSize: 16 }} />順番変更
          </button>
          <button
            onClick={() => !addDisabled && setShowAddConfirm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: addDisabled ? 0.4 : 1, pointerEvents: addDisabled ? 'none' : 'auto', transition: 'opacity .15s' }}
          >
            <i className="ti ti-user-plus" style={{ fontSize: 16 }} />メンバー追加
          </button>
        </div>
      </div>

      {showAddConfirm && (
        <Modal title="メンバーを追加" onClose={() => { setShowAddConfirm(false); setNewPlayerName('') }}>
          <input
            value={newPlayerName}
            onChange={e => setNewPlayerName(e.target.value)}
            placeholder={`プレイヤー${state.players.length + 1}`}
            style={{ width: '100%', marginBottom: 12 }}
            autoFocus
          />
          <ModalActions>
            <ModalButton onClick={() => { setShowAddConfirm(false); setNewPlayerName('') }}>キャンセル</ModalButton>
            <ModalButton onClick={handleAddConfirm} variant="primary">追加する</ModalButton>
          </ModalActions>
        </Modal>
      )}


      {/* プレイヤーカード */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: '1rem', padding: '0 16px' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: '1rem', padding: '0 16px' }}>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
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
        <button onClick={() => setShowHistory(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <i className="ti ti-history" style={{ fontSize: 16 }} />履歴
        </button>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="取り消し"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, padding: 0, border: 'none', background: 'transparent', color: 'var(--color-text-tertiary)', flexShrink: 0, opacity: canUndo ? 1 : 0.3 }}
        >
          <i className="ti ti-arrow-back-up" style={{ fontSize: 16 }} />
        </button>
      </div>

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

      {/* 履歴パネル */}
      {showHistory && (
        <div style={{ padding: '0 16px', marginTop: 12 }}>
          <HistoryPanel
            history={state.history}
            playerNames={state.players.map(p => p.name)}
            onClose={() => setShowHistory(false)}
          />
        </div>
      )}

      {/* ゲーム終了ボタン（最下部） */}
      <div style={{ padding: '16px 16px 0' }}>
        <button onClick={() => setShowEndConfirm(true)} style={{ ...dangerBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '11px 0' }}>
          <i className="ti ti-square-rounded-x" style={{ fontSize: 16 }} />ゲーム終了
        </button>
      </div>

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

      {showReorder && (
        <ReorderModal
          players={state.players}
          turnOrder={state.turnOrder}
          currentPlayerIdx={state.currentPlayerIdx}
          onConfirm={onChangeOrder}
          onClose={() => setShowReorder(false)}
        />
      )}
    </div>
  )
}
