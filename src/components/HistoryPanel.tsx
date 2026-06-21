import type { HistoryEvent, PointValue } from '../types'
import { POINT_LABELS, PLAYER_COLORS } from '../logic'

interface Props {
  history: HistoryEvent[]
  playerNames: string[]
  onClose: () => void
}

export function HistoryPanel({ history, playerNames, onClose }: Props) {
  const name = (idx: number) => playerNames[idx] ?? `プレイヤー${idx + 1}`
  const color = (idx: number) => PLAYER_COLORS[idx % PLAYER_COLORS.length]

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>履歴</span>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', padding: '2px 6px', color: 'var(--color-text-tertiary)', fontSize: 16 }}>✕</button>
      </div>
      <div>
        {history.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', padding: '8px 0' }}>まだ記録がありません</div>
        )}
        {[...history].reverse().slice(0, 20).map((event, i) => {
          if (event.type === 'shot') {
            const c = color(event.playerIdx)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.accent, flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontSize: 13, flex: 1 }}>
                  {name(event.playerIdx)} {POINT_LABELS[event.pointValue as PointValue]}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>ラック内</span>
              </div>
            )
          }
          if (event.type === 'pass') {
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-border-secondary)', flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontSize: 13, flex: 1, color: 'var(--color-text-secondary)' }}>
                  {name(event.fromIdx)} → {name(event.toIdx)}
                </span>
              </div>
            )
          }
          if (event.type === 'rack_end') {
            const detail = event.deltas.map((d, pi) => `${name(pi)} ${d > 0 ? '+' : ''}${d}`).join(' / ')
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
    </div>
  )
}
