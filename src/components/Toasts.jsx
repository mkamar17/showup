import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { useApp } from '../api/useApp'

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info }

export default function Toasts() {
  const { toasts, dismissToast } = useApp()
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] ?? Info
        return (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <Icon size={18} />
            <span>{t.message}</span>
            <button type="button" className="icon-btn icon-btn--sm" onClick={() => dismissToast(t.id)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
