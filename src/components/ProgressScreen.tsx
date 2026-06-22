import { useEffect, useRef, useState } from 'react'
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js'
import type { GameState, HistoryEvent } from '../types'
import { PLAYER_COLORS } from '../logic'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

interface Props {
  state: GameState
}

const PAGE_SIZE = 10

function buildCumulativeData(history: HistoryEvent[], playerCount: number) {
  const cumulative: number[][] = Array.from({ length: playerCount }, () => [0])
  const rackLabels: string[] = ['0']

  for (const event of history) {
    if (event.type === 'rack_end') {
      const last = cumulative.map(arr => arr[arr.length - 1])
      for (let i = 0; i < playerCount; i++) {
        cumulative[i].push(last[i] + (event.deltas[i] ?? 0))
      }
      rackLabels.push(String(event.rackNumber))
    }
  }
  return { cumulative, rackLabels }
}

export function ProgressScreen({ state }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const [page, setPage] = useState<number | null>(null)

  const playerCount = state.players.length
  const { cumulative, rackLabels } = buildCumulativeData(state.history, playerCount)
  const totalPoints = rackLabels.length // 含む初期0
  const maxPage = Math.max(0, Math.ceil((totalPoints - 1) / PAGE_SIZE) - 1)

  // 初期ページ: 最新の10ラック
  const currentPage = page ?? maxPage

  const start = currentPage * PAGE_SIZE
  const end = Math.min(start + PAGE_SIZE + 1, totalPoints)
  const pageLabels = rackLabels.slice(start, end)
  const pageData = cumulative.map(arr => arr.slice(start, end))

  useEffect(() => {
    if (!canvasRef.current) return
    if (chartRef.current) chartRef.current.destroy()

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const axisColor = isDark ? '#A8A6A0' : '#5F5E5A'
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
    const zeroColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)'

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: pageLabels,
        datasets: state.players.map((p, i) => {
          const c = PLAYER_COLORS[i % PLAYER_COLORS.length]
          return {
            label: p.name,
            data: pageData[i] ?? [],
            borderColor: c.accent,
            backgroundColor: c.accent,
            pointBackgroundColor: c.accent,
            borderDash: c.dash,
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.15,
          }
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: axisColor, autoSkip: false }, grid: { color: gridColor } },
          y: {
            ticks: { color: axisColor },
            grid: {
              color: (ctx) => ctx.tick.value === 0 ? zeroColor : gridColor,
              lineWidth: (ctx) => ctx.tick.value === 0 ? 2 : 1,
            },
          },
        },
      },
    })
    return () => { chartRef.current?.destroy() }
  }, [currentPage, playerCount, state.history.length])

  const changePage = (delta: number) => {
    const next = currentPage + delta
    if (next < 0 || next > maxPage) return
    setPage(next)
  }

  const pageStart = currentPage * PAGE_SIZE + 1
  const pageEnd = Math.min((currentPage + 1) * PAGE_SIZE, totalPoints - 1)
  const totalRacks = totalPoints - 1

  // ラックごとの増減点テーブル用
  const rackEndEvents = state.history.filter(e => e.type === 'rack_end') as Extract<typeof state.history[0], { type: 'rack_end' }>[]

  return (
    <div style={{ padding: '16px', background: 'var(--color-background-primary)', minHeight: '100vh' }}>
      {/* 凡例 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: '1rem', fontSize: 12, color: 'var(--color-text-secondary)' }}>
        {state.players.map((p, i) => {
          const c = PLAYER_COLORS[i % PLAYER_COLORS.length]
          const dashStr = c.dash.join(',')
          return (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="18" height="8" aria-hidden="true">
                <line x1="0" y1="4" x2="18" y2="4" stroke={c.accent} strokeWidth="2" strokeDasharray={dashStr} />
              </svg>
              {p.name}
            </span>
          )
        })}
      </div>

      {/* ページャー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button
          onClick={() => changePage(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, opacity: currentPage <= 0 ? 0.4 : 1, pointerEvents: currentPage <= 0 ? 'none' : 'auto' }}
        >
          <i className="ti ti-chevron-left" style={{ fontSize: 15 }} />前の10ラック
        </button>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {totalRacks === 0 ? 'データなし' : `ラック ${pageStart}-${pageEnd} / ${totalRacks}`}
        </span>
        <button
          onClick={() => changePage(1)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, opacity: currentPage >= maxPage ? 0.4 : 1, pointerEvents: currentPage >= maxPage ? 'none' : 'auto' }}
        >
          次の10ラック<i className="ti ti-chevron-right" style={{ fontSize: 15 }} />
        </button>
      </div>

      {/* グラフ */}
      <div style={{ position: 'relative', width: '100%', height: 260, marginBottom: '1.25rem' }}>
        <canvas ref={canvasRef} role="img" aria-label="ラックごとの累計得点推移" />
      </div>

      {/* 補助テーブル */}
      {totalRacks > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--color-border-secondary)' }}>
              <th style={{ textAlign: 'left', padding: '5px 4px', fontWeight: 500, color: 'var(--color-text-tertiary)', fontSize: 11 }}>ラック</th>
              {state.players.map(p => (
                <th key={p.id} style={{ textAlign: 'right', padding: '5px 4px', fontWeight: 500, color: 'var(--color-text-tertiary)', fontSize: 11 }}>{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rackEndEvents.slice((currentPage) * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE).map(event => (
              <tr key={event.rackNumber} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                <td style={{ padding: '5px 4px', color: 'var(--color-text-tertiary)' }}>
                  {event.rackNumber}{event.masuwari && <span style={{ color: 'var(--color-warning)' }}>★</span>}
                </td>
                {event.deltas.map((d, pi) => {
                  const c = PLAYER_COLORS[pi % PLAYER_COLORS.length]
                  return (
                    <td key={pi} style={{ padding: '5px 4px', textAlign: 'right', color: d > 0 ? c.accent : 'var(--color-text-tertiary)' }}>
                      {d > 0 ? '+' : ''}{d}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalRacks === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 13, marginTop: 40 }}>
          まだラックが終了していません
        </div>
      )}
    </div>
  )
}
