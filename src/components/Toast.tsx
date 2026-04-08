import { useState, useCallback, useEffect } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

let toastFn: ((message: string, type?: Toast['type']) => void) | null = null

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  useEffect(() => { toastFn = show; return () => { toastFn = null } }, [show])

  return { toasts, show }
}

// eslint-disable-next-line react-refresh/only-export-components
export function toast(message: string, type: Toast['type'] = 'success') {
  toastFn?.(message, type)
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null

  const colors = {
    success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', icon: '✓' },
    error:   { bg: '#FFF1F2', border: '#FECDD3', text: '#9F1239', icon: '✕' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', icon: 'i' },
  }

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4">
      {toasts.map((t) => {
        const c = colors[t.type]
        return (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg"
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              animation: 'slideDown 0.3s ease',
            }}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: c.border, color: c.text }}>
              {c.icon}
            </span>
            <p className="text-sm font-medium" style={{ color: c.text }}>{t.message}</p>
          </div>
        )
      })}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}