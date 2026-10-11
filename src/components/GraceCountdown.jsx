import { Hourglass, Zap } from 'lucide-react'
import { useApp } from '../api/useApp'
import { formatCountdown, formatGrace, timeUntil } from '../api/format'

export default function GraceCountdown({ event, phase }) {
  const { now } = useApp()

  if (phase === 'grace') {
    const total = event.graceEndsAt - event.startAt
    const left = event.graceEndsAt - now
    const pct = Math.max(0, Math.min(100, (left / total) * 100))
    return (
      <section className="countdown countdown--grace">
        <div className="countdown__label">
          <Hourglass size={18} />
          Grace period ends in
          {event.demoFast && (
            <span className="pill pill--light">
              <Zap size={11} /> Demo speed
            </span>
          )}
        </div>
        <strong className="countdown__time">{formatCountdown(left)}</strong>
        <div className="progress progress--light">
          <span style={{ width: `${pct}%` }} />
        </div>
        <small>Check in before the timer runs out — after that, no-shows’ money is split between attendees.</small>
      </section>
    )
  }

  if (phase === 'settling') {
    return (
      <section className="countdown countdown--grace">
        <div className="countdown__label">
          <Hourglass size={18} /> Grace period over
        </div>
        <strong className="countdown__time">Settling…</strong>
      </section>
    )
  }

  return (
    <section className="countdown">
      <div className="countdown__label">
        <Hourglass size={18} /> {phase === 'checkin-open' ? 'Check-in is open · starts in' : 'Starts in'}
      </div>
      <strong className="countdown__time">{event.startAt - now < 3600000 ? formatCountdown(event.startAt - now) : timeUntil(event.startAt, now)}</strong>
      <small>
        Then a {formatGrace(event.graceMinutes)} grace period before money moves.
      </small>
    </section>
  )
}
