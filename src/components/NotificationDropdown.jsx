import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useApp } from '../api/useApp'
import { useClickOutside } from '../api/hooks'
import { relativeTime } from '../api/format'

export default function NotificationDropdown() {
  const { state, now, markNotificationRead, markAllRead, clearNotifications } = useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(ref, close, open)

  const unread = state.notifications.filter((n) => !n.read).length

  return (
    <div className="notif" ref={ref}>
      <button
        type="button"
        className={`notif__trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications (${unread} unread)`}
      >
        <Bell size={20} />
        <span className="notif__label">Notifications</span>
        {unread > 0 && <span className="notif__badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="dropdown notif__panel">
          <div className="notif__head">
            <strong>Notifications</strong>
            <div className="notif__head-actions">
              <button type="button" className="link-btn" onClick={markAllRead} disabled={!unread}>
                Mark all read
              </button>
              <button type="button" className="link-btn" onClick={clearNotifications} disabled={!state.notifications.length}>
                Clear
              </button>
            </div>
          </div>
          {state.notifications.length === 0 && <p className="dropdown__empty">You're all caught up.</p>}
          <ul className="notif__list">
            {state.notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`notif__item notif__item--${n.kind}${n.read ? '' : ' is-unread'}`}
                  onClick={() => {
                    markNotificationRead(n.id)
                    setOpen(false)
                    if (n.link) navigate(n.link)
                  }}
                >
                  <span className="notif__dot" />
                  <span>
                    {n.text}
                    <small>{relativeTime(n.time, now)}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
