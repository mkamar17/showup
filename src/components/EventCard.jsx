import { useNavigate } from 'react-router-dom'
import { Crown, MapPin, Repeat } from 'lucide-react'
import { useApp } from '../api/useApp'
import { getPhase, memberCounts } from '../api/eventLogic'
import { daysLeftLabel, formatDateTime, formatMoney } from '../api/format'
import { ME_ID } from '../api/constants'
import ActivityIcon from './ActivityIcon'
import { PhasePill } from './StatusPill'

export default function EventCard({ event }) {
  const { now } = useApp()
  const navigate = useNavigate()
  const phase = getPhase(event, now)
  const counts = memberCounts(event)
  const settled = phase === 'settled'
  const progress = settled
    ? counts.committed ? Math.round((event.settlement.attendees.length / counts.committed) * 100) : 0
    : Math.round((counts.committed / Math.max(1, counts.total)) * 100)
  const myStatus = event.members[ME_ID]?.status

  return (
    <article className="event-card" onClick={() => navigate(`/events/${event.id}`)} role="link" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${event.id}`)}>
      <div className="event-card__icon">
        <ActivityIcon activity={event.activity} size={30} />
      </div>
      <div className="event-card__head">
        <h3>{event.title}</h3>
        <p className="muted small">{formatDateTime(event.startAt)}</p>
        <p className="muted small event-card__venue">
          <MapPin size={12} /> {event.venue.name}
        </p>
        <div className="event-card__tags">
          <PhasePill phase={phase} />
          {event.adminId === ME_ID && (
            <span className="pill pill--soft">
              <Crown size={11} /> Admin
            </span>
          )}
          {event.repeatWeekly && (
            <span className="pill pill--soft">
              <Repeat size={11} /> Weekly
            </span>
          )}
        </div>
      </div>
      <div className="progress-row">
        <span>{settled ? 'Showed up' : 'Committed'}</span>
        <strong>{progress}%</strong>
      </div>
      <div className="progress">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="event-card__foot">
        <span className="muted small">
          {settled ? `${event.settlement.attendees.length}/${counts.committed} attended` : `${counts.committed}/${counts.total} · ${formatMoney(event.amount)} each`}
        </span>
        <span className={`pill ${myStatus === 'invited' && !settled ? 'pill--pink' : 'pill--pink-soft'}`}>
          {settled ? 'Settled' : myStatus === 'invited' ? 'Respond' : daysLeftLabel(event.startAt, now)}
        </span>
      </div>
    </article>
  )
}
