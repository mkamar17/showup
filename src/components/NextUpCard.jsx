import { useNavigate } from 'react-router-dom'
import { ME_ID } from '../api/constants'
import { useApp } from '../api/useApp'
import { isClosed } from '../api/eventLogic'
import { formatDateTime, timeUntil } from '../api/format'
import ActivityIcon from './ActivityIcon'

// Wine card in the side column: your next event, or a nudge to create one.
export default function NextUpCard({ onCreate }) {
  const { state, now } = useApp()
  const navigate = useNavigate()
  const next = state.events
    .filter((e) => !isClosed(e) && e.members[ME_ID] && e.members[ME_ID].status !== 'declined')
    .sort((a, b) => a.startAt - b.startAt)[0]

  return next ? (
    <button type="button" className="next-up" onClick={() => navigate(`/events/${next.id}`)}>
      <span className="next-up__icon">
        <ActivityIcon activity={next.activity} size={26} />
      </span>
      <span className="next-up__text">
        <small>Next up · {next.startAt > now ? `in ${timeUntil(next.startAt, now)}` : 'happening now'}</small>
        <strong>{next.title}</strong>
        <small>{formatDateTime(next.startAt)}</small>
      </span>
    </button>
  ) : (
    <button type="button" className="next-up" onClick={onCreate}>
      <span className="next-up__icon">
        <ActivityIcon activity="other" size={26} />
      </span>
      <span className="next-up__text">
        <small>Nothing planned</small>
        <strong>Create an event</strong>
      </span>
    </button>
  )
}
