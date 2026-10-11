// A past event as a record of your participation: did you show up, what it
// meant for your money, and a way into the event's memory.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Ban, CircleCheck, CircleX, ImagePlus, MapPin, RotateCcw, TrainFront } from 'lucide-react'
import { useApp } from '../api/useApp'
import { ME_ID } from '../api/constants'
import { canShareMemories, photosForEvent, settledOutcome } from '../api/eventLogic'
import { formatDate, formatMoney } from '../api/format'
import ActivityIcon from './ActivityIcon'
import { AvatarStack } from './Avatar'
import AddPhotosModal from './AddPhotosModal'
import { PhotoStrip } from './MemoryPhotos'

const OUTCOME = {
  showed: { icon: CircleCheck, label: 'You showed up', className: 'pill--success-soft' },
  missed: { icon: CircleX, label: 'You missed it', className: 'pill--danger-soft' },
  refunded: { icon: RotateCcw, label: 'Nobody checked in', className: 'pill--soft' },
  excused: { icon: TrainFront, label: 'Excused by TfL', className: 'pill--mustard-soft' },
  none: { icon: null, label: 'You didn’t join', className: 'pill--soft' },
}

// Called off before it started: no outcome, everyone's money went back.
function CancelledSummary({ event }) {
  const { state } = useApp()
  const by = event.cancelled.by === ME_ID ? 'you' : (state.users[event.cancelled.by]?.name ?? 'the organiser')
  const committed = event.members[ME_ID]?.status === 'committed'
  return (
    <>
      <div className="history-card__result">
        <span className="pill pill--phase-cancelled">
          <Ban size={12} /> Cancelled
        </span>
        {committed && <span className="small muted">{formatMoney(event.amount)} returned to you</span>}
      </div>
      <p className="muted small">
        Called off by {by}
        {event.cancelled.message ? ` · “${event.cancelled.message}”` : ''}
      </p>
    </>
  )
}

function moneyLine(outcome, amount) {
  if (outcome.kind === 'showed') {
    return outcome.net > 0 ? `${formatMoney(amount)} returned + ${formatMoney(outcome.net)} earned` : `${formatMoney(amount)} commitment returned`
  }
  if (outcome.kind === 'missed') return `${formatMoney(amount)} paid to those who came`
  if (outcome.kind === 'refunded') return `${formatMoney(amount)} refunded to everyone`
  if (outcome.kind === 'excused') return `${formatMoney(amount)} released by TfL protection`
  return null
}

export default function HistoryCard({ event }) {
  const { state } = useApp()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)
  const s = event.settlement
  const cancelled = Boolean(event.cancelled)
  const outcome = settledOutcome(event, ME_ID)
  const { icon: OutcomeIcon, label, className } = OUTCOME[outcome.kind]
  const money = moneyLine(outcome, event.amount)
  const canShare = canShareMemories(event, ME_ID)
  const photos = photosForEvent(state.photos, event.id)
  const open = () => navigate(`/events/${event.id}`)
  const stop = (e) => e.stopPropagation()

  return (
    <article className="history-card" onClick={open} role="link" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && open()}>
      <div className="history-card__top">
        <span className="history-card__icon">
          <ActivityIcon activity={event.activity} size={22} />
        </span>
        <div>
          <h3>{event.title}</h3>
          <p className="muted small">{formatDate(event.startAt, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="muted small history-card__venue">
            <MapPin size={12} /> {event.venue.name}
          </p>
        </div>
      </div>

      {cancelled ? (
        <CancelledSummary event={event} />
      ) : (
        <>
          <div className="history-card__result">
            <span className={`pill ${className}`}>
              {OutcomeIcon && <OutcomeIcon size={12} />} {label}
            </span>
            {money && <span className={`small ${outcome.kind === 'missed' ? 'amount amount--minus' : outcome.net > 0 ? 'amount amount--plus' : 'muted'}`}>{money}</span>}
          </div>

          <div className="history-card__people">
            <AvatarStack users={s.attendees.map((id) => state.users[id]).filter(Boolean)} size={26} max={5} />
            <span className="muted small">
              {s.attendees.length} of {s.committed.length} showed up
            </span>
          </div>
        </>
      )}

      {canShare && !cancelled && (
        <div className="history-card__memory" onClick={stop}>
          {photos.length ? (
            <Link to={`/memories/${event.id}`} className="history-card__memory-link">
              <PhotoStrip photos={photos} max={3} />
              <span>
                {photos.length} photo{photos.length === 1 ? '' : 's'} <ArrowRight size={14} />
              </span>
            </Link>
          ) : (
            <div className="history-card__memory-empty">
              <span className="muted small">No memories yet</span>
              <button type="button" className="btn btn--soft btn--sm" onClick={() => setAdding(true)}>
                <ImagePlus size={15} /> Add photos
              </button>
            </div>
          )}
        </div>
      )}

      {adding && (
        <div onClick={stop}>
          <AddPhotosModal eventId={event.id} title={event.title} onClose={() => setAdding(false)} />
        </div>
      )}
    </article>
  )
}
