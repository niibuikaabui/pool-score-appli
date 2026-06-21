import type { Player, RackShot, PointValue } from '../types'
import { PLAYER_COLORS, POINT_LABELS } from '../logic'

interface Props {
  player: Player
  colorIdx: number
  isActive: boolean
  rackShots: RackShot[]
  rackDelta: number
  order: number
}

export function PlayerCard({ player, colorIdx, isActive, rackShots, rackDelta, order }: Props) {
  const c = PLAYER_COLORS[colorIdx % PLAYER_COLORS.length]
  const myShots = rackShots.filter(s => s.playerIdx === player.id)

  return (
    <div style={{
      order,
      background: isActive ? c.bg : 'var(--color-background-secondary)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '1rem',
      border: `3px solid ${isActive ? c.accent : 'transparent'}`,
      transform: isActive ? 'scale(1.02)' : 'scale(1)',
      transition: 'transform 0.15s, background-color 0.15s, border-color 0.15s',
      flex: '1',
      minWidth: 0,
    }}>
      {/* 名前行: 高さ固定 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 28, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.accent, flexShrink: 0, display: 'inline-block' }} />
          <span style={{ fontSize: 17, fontWeight: 600, color: isActive ? c.text : 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player.name}
          </span>
        </div>
        {isActive && (
          <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, fontWeight: 500, background: c.accent, color: c.text, flexShrink: 0, marginLeft: 4 }}>手番</span>
        )}
      </div>

      {/* スコア: 高さ固定 */}
      <div style={{ fontSize: 48, fontWeight: 500, lineHeight: 1, marginBottom: 4, color: isActive ? c.text : 'var(--color-text-primary)' }}>
        {player.score}
      </div>

      {/* ラック増減: 高さ固定 */}
      <div style={{ fontSize: 12, color: isActive ? c.subtext : 'var(--color-text-tertiary)', height: 18, marginBottom: 6 }}>
        このラック {rackDelta > 0 ? '+' : ''}{rackDelta}
      </div>

      {/* ショット丸数字: 高さ固定・折り返しなし */}
      <div style={{ height: 22, overflow: 'hidden', display: 'flex', gap: 2, alignItems: 'center' }}>
        {myShots.map((s, i) => (
          <span key={i} style={{ fontSize: 17, lineHeight: 1, color: c.accent }}>
            {POINT_LABELS[s.pointValue as PointValue]}
          </span>
        ))}
      </div>
    </div>
  )
}
