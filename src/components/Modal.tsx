import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  children: ReactNode
  onClose?: () => void
}

export function Modal({ title, description, children, onClose }: Props) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--color-background-primary)', borderRadius: 'var(--border-radius-lg)', padding: '1.25rem', width: 260, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: description ? 4 : 16 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{title}</span>
          {onClose && (
            <button onClick={onClose} aria-label="閉じる" style={{ background: 'transparent', border: 'none', padding: '0 0 0 8px', color: 'var(--color-text-tertiary)', fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center' }}>
              <i className="ti ti-x" style={{ fontSize: 16 }} />
            </button>
          )}
        </div>
        {description && (
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 16 }}>{description}</div>
        )}
        {children}
      </div>
    </div>
  )
}

export function ModalActions({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {children}
    </div>
  )
}

export function ModalButton({
  onClick,
  variant = 'default',
  children,
}: {
  onClick: () => void
  variant?: 'default' | 'primary' | 'danger'
  children: ReactNode
}) {
  const styles: Record<string, React.CSSProperties> = {
    default: {},
    primary: { background: 'var(--color-accent)', color: 'var(--color-accent-contrast)', border: 'none', fontWeight: 600 },
    danger:  { background: 'var(--color-danger)', color: '#fff', border: 'none', fontWeight: 600 },
  }
  return (
    <button onClick={onClick} style={{ flex: 1, padding: '9px 0', ...styles[variant] }}>
      {children}
    </button>
  )
}
