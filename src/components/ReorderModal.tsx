import { useState } from 'react'
import type { Player } from '../types'
import { PLAYER_COLORS, shuffleExceptCurrent } from '../logic'
import { Modal, ModalActions, ModalButton } from './Modal'

interface Props {
  players: Player[]
  turnOrder: number[]
  currentPlayerIdx: number
  onConfirm: (newOrder: number[]) => void
  onClose: () => void
}

export function ReorderModal({ players, turnOrder, currentPlayerIdx, onConfirm, onClose }: Props) {
  const [order, setOrder] = useState([
    currentPlayerIdx,
    ...turnOrder.filter(i => i !== currentPlayerIdx),
  ])

  const moveUp = (pos: number) => {
    if (pos <= 0) return
    const next = [...order]
    ;[next[pos], next[pos - 1]] = [next[pos - 1], next[pos]]
    setOrder(next)
  }

  const moveDown = (pos: number) => {
    if (pos >= order.length - 1) return
    const next = [...order]
    ;[next[pos], next[pos + 1]] = [next[pos + 1], next[pos]]
    setOrder(next)
  }

  return (
    <Modal
      title="打順を変更"
      description="ランダムや手動で並び替えできます"
      onClose={onClose}
    >
      <button
        onClick={() => setOrder(shuffleExceptCurrent(order, currentPlayerIdx))}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 }}
      >
        <i className="ti ti-arrows-shuffle" style={{ fontSize: 15 }} />
        ランダムに並び替え
      </button>

      <div style={{ marginBottom: 12 }}>
        {order.map((playerIdx, pos) => {
          const player = players[playerIdx]
          const c = PLAYER_COLORS[playerIdx % PLAYER_COLORS.length]
          const isCurrent = playerIdx === currentPlayerIdx
          return (
            <div key={playerIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.accent, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: 13, flex: 1 }}>
                {player.name}{isCurrent && <span style={{ color: 'var(--color-text-tertiary)' }}> (手番中)</span>}
              </span>
              <button onClick={() => moveUp(pos)} disabled={pos === 0} style={{ padding: '2px 8px', opacity: pos === 0 ? 0.3 : 1 }}>
                <i className="ti ti-chevron-up" style={{ fontSize: 14 }} />
              </button>
              <button onClick={() => moveDown(pos)} disabled={pos >= order.length - 1} style={{ padding: '2px 8px', opacity: pos >= order.length - 1 ? 0.3 : 1 }}>
                <i className="ti ti-chevron-down" style={{ fontSize: 14 }} />
              </button>
            </div>
          )
        })}
      </div>

      <ModalActions>
        <ModalButton onClick={onClose}>キャンセル</ModalButton>
        <ModalButton onClick={() => { onConfirm(order); onClose() }} variant="primary">決定</ModalButton>
      </ModalActions>
    </Modal>
  )
}
