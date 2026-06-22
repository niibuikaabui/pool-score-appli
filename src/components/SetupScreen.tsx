import { useState } from 'react'

interface Props {
  onStart: (playerNames: string[], pointBall: number, finalBall: 9 | 10) => void
}

const card: React.CSSProperties = {
  background: 'var(--color-background-secondary)',
  borderRadius: 'var(--border-radius-lg)',
  padding: '1.25rem',
  marginBottom: '1rem',
}

export function SetupScreen({ onStart }: Props) {
  const [names, setNames] = useState(['', '', ''])
  const updateName = (i: number, val: string) => {
    const next = [...names]; next[i] = val; setNames(next)
  }
  const addPlayer = () => { if (names.length < 6) setNames([...names, '']) }
  const removePlayer = (i: number) => { if (names.length > 2) setNames(names.filter((_, idx) => idx !== i)) }
  const filled = names.map((n, i) => n.trim() || `プレイヤー${i + 1}`)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ fontSize: 22, fontWeight: 600, marginBottom: '1.5rem' }}>ポイントゲーム　スコアアプリ</div>

      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={card}>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 10 }}>プレイヤー</div>
          {names.map((name, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input
                style={{ flex: 1 }}
                placeholder={`プレイヤー${i + 1}`}
                value={name}
                onChange={e => updateName(i, e.target.value)}
              />
              {names.length > 2 && (
                <button onClick={() => removePlayer(i)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-tertiary)', padding: '4px 8px' }}>✕</button>
              )}
            </div>
          ))}
          {names.length < 6 && (
            <button onClick={addPlayer} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-info)', padding: 0, fontSize: 13 }}>
              + プレイヤーを追加
            </button>
          )}
        </div>

        <button
          onClick={() => onStart(filled, 5, 9)}
          style={{ width: '100%', padding: '14px 0', fontSize: 16, fontWeight: 600, background: 'var(--color-accent)', color: 'var(--color-accent-contrast)', border: 'none', borderRadius: 'var(--border-radius-lg)' }}
        >
          ゲーム開始
        </button>
      </div>
    </div>
  )
}
