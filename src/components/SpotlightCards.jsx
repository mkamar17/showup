import { useNavigate } from 'react-router-dom'
import { ChevronRight, Wallet } from 'lucide-react'
import { useApp } from '../api/useApp'
import { ME_ID } from '../api/constants'
import { formatMoney, formatDateTime, timeUntil } from '../api/format'
import ActivityIcon from './ActivityIcon'

export default function SpotlightCards({ onCreate }) {
  const { state, me, now } = useApp()
  const navigate = useNavigate()

  const mine = state.events.filter((e) => !e.settled && e.members[ME_ID] && e.members[ME_ID].status !== 'declined')
  const next = [...mine].sort((a, b) => a.startAt - b.startAt)[0]
  const heldEvents = mine.filter((e) => e.members[ME_ID].status === 'committed')

  return (
    <div className="spotlight">
      {next ? (
        <button type="button" className="spot-card spot-card--purple" onClick={() => navigate(`/events/${next.id}`)}>
          <span className="spot-card__icon">
            <ActivityIcon activity={next.activity} size={28} />
          </span>
          <span className="spot-card__text">
            <small>Next up · {next.startAt > now ? `in ${timeUntil(next.startAt, now)}` : 'happening now'}</small>
            <strong>{next.title}</strong>
            <small>{formatDateTime(next.startAt)}</small>
          </span>
        </button>
      ) : (
        <button type="button" className="spot-card spot-card--purple" onClick={onCreate}>
          <span className="spot-card__icon">
            <ActivityIcon activity="other" size={28} />
          </span>
          <span className="spot-card__text">
            <small>Nothing planned</small>
            <strong>Create an event</strong>
          </span>
        </button>
      )}

      <button type="button" className="spot-card spot-card--pink" onClick={() => navigate('/profile?tab=wallet')}>
        <span className="spot-card__icon">
          <Wallet size={28} />
        </span>
        <span className="spot-card__text">
          <small>Held for events</small>
          <strong className="spot-card__big">{formatMoney(me.held)}</strong>
          <small>
            across {heldEvents.length} event{heldEvents.length === 1 ? '' : 's'}
          </small>
        </span>
        <span className="spot-card__arrow">
          <ChevronRight size={20} />
        </span>
      </button>
    </div>
  )
}
