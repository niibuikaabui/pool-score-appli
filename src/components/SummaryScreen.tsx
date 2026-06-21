import type { GameState } from '../types'
import { PLAYER_COLORS, generateCsv } from '../logic'

interface Props {
  state: GameState
  onRestart: () => void
}

export function SummaryScreen({ state, onRestart }: Props) {
  const sorted = [...state.players].sort((a, b) => b.score - a.score)

  const downloadCsv = () => {
    const csv = generateCsv(state)
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `billiards_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 500, marginBottom: 16 }}>お疲れさまでした</div>

      <div style={{ width: '100%', maxWidth: 400, marginBottom: '1.5rem' }}>
        {sorted.map((player, rank) => {
          const c = PLAYER_COLORS[player.id % PLAYER_COLORS.length]
          return (
            <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: c.bg, borderRadius: 'var(--border-radius-md)', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: c.subtext, width: 20 }}>{rank + 1}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: c.text }}>{player.name}</span>
              <span style={{ fontSize: 22, fontWeight: 500, color: c.text }}>{player.score}</span>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 400 }}>
        <button onClick={downloadCsv} style={{ flex: 1, padding: '12px 0', fontSize: 14 }}>
          CSVダウンロード
        </button>
        <button
          onClick={onRestart}
          style={{ flex: 1, padding: '12px 0', fontSize: 14, background: 'var(--color-background-info)', color: 'var(--color-text-info)', border: 'none', fontWeight: 600 }}
        >
          新しいゲーム
        </button>
      </div>
    </div>
  )
}
