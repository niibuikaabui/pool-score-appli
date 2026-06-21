import { useState } from 'react'
import { useGameState } from './useGameState'
import { SetupScreen } from './components/SetupScreen'
import { ScoreScreen } from './components/ScoreScreen'
import { SummaryScreen } from './components/SummaryScreen'
import { ProgressScreen } from './components/ProgressScreen'

type Phase = 'setup' | 'playing' | 'finished'
type Tab = 'score' | 'progress'

export default function App() {
  const { state, undoStack, shot, pass, finishRack, changeOrder, addNewPlayer, finishGame, resetGame, undo, canUndo } = useGameState()
  const [phase, setPhase] = useState<Phase>(() => {
    try {
      const saved = localStorage.getItem('pool_game_state')
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.finished ? 'finished' : 'playing'
      }
    } catch {}
    return 'setup'
  })
  const [tab, setTab] = useState<Tab>('score')

  const handleStart = (playerNames: string[], pointBall: number, finalBall: 9 | 10) => {
    resetGame(playerNames, pointBall, finalBall)
    setPhase('playing')
    setTab('score')
  }

  const handleFinish = () => {
    finishGame()
    setPhase('finished')
  }

  const handleRestart = () => {
    localStorage.removeItem('pool_game_state')
    setPhase('setup')
  }

  if (phase === 'setup') return <SetupScreen onStart={handleStart} />
  if (phase === 'finished') return <SummaryScreen state={state} onRestart={handleRestart} />

  return (
    <div style={{ background: 'var(--color-background-primary)', minHeight: '100vh' }}>
      {/* タブ */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 16px 0' }}>
        <button
          onClick={() => setTab('score')}
          style={tab === 'score'
            ? { flex: 1, padding: '8px 0', border: 'none', background: 'var(--color-background-info)', color: 'var(--color-text-info)', fontWeight: 500, fontSize: 14 }
            : { flex: 1, padding: '8px 0', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 14 }
          }
        >
          スコア
        </button>
        <button
          onClick={() => setTab('progress')}
          style={tab === 'progress'
            ? { flex: 1, padding: '8px 0', border: 'none', background: 'var(--color-background-info)', color: 'var(--color-text-info)', fontWeight: 500, fontSize: 14 }
            : { flex: 1, padding: '8px 0', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 14 }
          }
        >
          推移
        </button>
      </div>

      {tab === 'score' && (
        <ScoreScreen
          state={state}
          canUndo={canUndo}
          onShot={shot}
          onPass={pass}
          onFinishRack={finishRack}
          onChangeOrder={changeOrder}
          onAddPlayer={addNewPlayer}
          onFinishGame={handleFinish}
          onUndo={undo}
        />
      )}

      {tab === 'progress' && <ProgressScreen state={state} />}
    </div>
  )
}
