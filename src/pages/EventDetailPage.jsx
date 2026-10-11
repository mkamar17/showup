import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Ban, CircleCheck, Clock, Crown, ImagePlus, Images, Landmark, MapPin, Pencil, PoundSterling, Repeat, ShieldCheck, Timer, Trash2 } from 'lucide-react'
import { useApp } from '../api/useApp'
import { ME_ID } from '../api/constants'
import { canCancel, canCommitInPhase, canShareMemories, eventReference, getPhase, isClosed, photosForEvent } from '../api/eventLogic'
import { formatDateTime, formatGrace, formatMoney } from '../api/format'
import ActivityIcon from '../components/ActivityIcon'
import { PhasePill } from '../components/StatusPill'
import CheckInPanel from '../components/CheckInPanel'
import DelayProtectionCard from '../components/DelayProtectionCard'
import GraceCountdown from '../components/GraceCountdown'
import MemberList from '../components/MemberList'
import DemoControls from '../components/DemoControls'
import EventForm from '../components/EventForm'
import ConfirmModal from '../components/ConfirmModal'
import Modal from '../components/Modal'
import { AddPeopleModal } from '../components/InviteModal'
import CommitModal from '../components/CommitModal'
import StarlingConnectModal from '../components/StarlingConnectModal'
import AddPhotosModal from '../components/AddPhotosModal'
import { PhotoStrip } from '../components/MemoryPhotos'
import '../styles/eventDetail.css'

// Admin calls the event off before it starts. Everyone's money goes back, and
// the optional message is shown to the group on the cancelled event.
function CancelEventModal({ event, onClose }) {
  const { cancelEvent } = useApp()
  const [message, setMessage] = useState('')
  const committed = Object.values(event.members).filter((m) => m.status === 'committed').length

  return (
    <Modal
      title={`Cancel ${event.title}?`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Keep event
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              cancelEvent(event.id, message)
              onClose()
            }}
          >
            Cancel event
          </button>
        </>
      }
    >
      <p className="muted">
        {committed
          ? `Everyone who committed (${committed} ${committed === 1 ? 'person' : 'people'}) gets their ${formatMoney(event.amount)} back straight away.`
          : 'Nobody has committed yet, so no money needs to move.'}{' '}
        The event stays in everyone’s history as cancelled.
      </p>
      <label className="field cancel-event__field">
        <span>Message to the group (optional)</span>
        <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={200} placeholder="e.g. Court’s flooded, rebooking for Sunday" />
      </label>
    </Modal>
  )
}

// After the event: its shared photo memory, and the way to add to it.
function EventMemory({ event, onAdd }) {
  const { state } = useApp()
  const photos = photosForEvent(state.photos, event.id)
  const people = new Set(photos.map((p) => p.uploadedBy)).size

  return (
    <section className="card event-memory">
      <div className="card__head">
        <h2>
          <Images size={18} /> Memories
        </h2>
        {photos.length > 0 && (
          <Link to={`/memories/${event.id}`} className="link-btn">
            View all <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {photos.length > 0 ? (
        <Link to={`/memories/${event.id}`} className="event-memory__preview">
          <PhotoStrip photos={photos} max={4} />
          <span className="muted small">
            {photos.length} photo{photos.length === 1 ? '' : 's'} from {people} {people === 1 ? 'person' : 'people'}
          </span>
        </Link>
      ) : (
        <p className="muted">No photos yet. Add what you captured; everyone who joined will see them.</p>
      )}
      <button type="button" className="btn btn--primary" onClick={onAdd}>
        <ImagePlus size={17} /> Add photos
      </button>
    </section>
  )
}

export default function EventDetailPage() {
  const { eventId } = useParams()
  const { state, me, now, decline, deleteEvent } = useApp()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmCommit, setConfirmCommit] = useState(false)
  const [addingPeople, setAddingPeople] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [addingPhotos, setAddingPhotos] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const event = state.events.find((e) => e.id === eventId)
  if (!event) {
    return (
      <div className="empty-state">
        <p>This event doesn’t exist any more.</p>
        <Link to="/dashboard" className="btn btn--primary">
          Back home
        </Link>
      </div>
    )
  }

  const phase = getPhase(event, now)
  const isAdmin = event.adminId === ME_ID
  const myMember = event.members[ME_ID]
  const admin = state.users[event.adminId]
  const closed = isClosed(event)
  const hasCommitments = Object.values(event.members).some((m) => m.status === 'committed')
  const canceller = event.cancelled && (event.cancelled.by === ME_ID ? 'you' : state.users[event.cancelled.by]?.name)
  const nextInSeries = closed
    ? state.events.find((e) => e.seriesId === event.seriesId && e.startAt > event.startAt)
    : null

  return (
    <div className="event-detail">
      <button type="button" className="link-btn back-link" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <header className="event-hero">
        <div className="event-hero__icon">
          <ActivityIcon activity={event.activity} size={34} />
        </div>
        <div className="event-hero__info">
          <div className="event-hero__tags">
            <PhasePill phase={phase} />
            {event.repeatWeekly && (
              <span className="pill pill--light">
                <Repeat size={11} /> Weekly
              </span>
            )}
            {isAdmin && (
              <span className="pill pill--light">
                <Crown size={11} /> You’re the admin
              </span>
            )}
          </div>
          <h2>{event.title}</h2>
          <ul className="event-hero__meta">
            <li>
              <Clock size={15} /> {formatDateTime(event.startAt)}
            </li>
            <li>
              <MapPin size={15} /> {event.venue.name}
            </li>
            <li>
              <PoundSterling size={15} /> {formatMoney(event.amount)} commitment
            </li>
            <li>
              <Timer size={15} /> {formatGrace(event.graceMinutes)} grace · {event.radius}m radius
            </li>
          </ul>
          {!isAdmin && <p className="event-hero__admin">Organised by {admin.name}</p>}
        </div>
        {isAdmin && (
          <div className="event-hero__actions">
            {!closed && (
              <button type="button" className="btn btn--light" onClick={() => setEditing(true)}>
                <Pencil size={16} /> Edit
              </button>
            )}
            {canCancel(event, now) && (
              <button type="button" className="btn btn--light" onClick={() => setCancelling(true)}>
                <Ban size={16} /> Cancel event
              </button>
            )}
            {/* Once money is held, cancelling is how it goes back (visibly) */}
            {(closed || !hasCommitments) && (
              <button type="button" className="btn btn--light" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
        )}
      </header>

      {event.settled && (
        <div className="banner banner--success">
          <CircleCheck size={22} />
          <div>
            <strong>Settlement complete</strong>
            <span>
              {event.settlement.attendees.length} attended · {event.settlement.noShows.length} no-show
              {event.settlement.noShows.length === 1 ? '' : 's'}
            </span>
          </div>
          <Link to={`/events/${event.id}/settlement`} className="btn btn--primary btn--sm">
            View settlement <ArrowRight size={15} />
          </Link>
        </div>
      )}
      {event.cancelled && (
        <div className="banner banner--cancelled">
          <Ban size={22} />
          <div>
            <strong>Cancelled by {canceller ?? 'the organiser'}</strong>
            <span>
              {event.cancelled.message ? `“${event.cancelled.message}” · ` : ''}
              {hasCommitments ? `Every commitment (${formatMoney(event.amount)} each) was returned.` : 'No money had been committed.'}
            </span>
          </div>
        </div>
      )}
      {nextInSeries && (
        <p className="muted small">
          <Repeat size={13} /> Next one:{' '}
          <Link to={`/events/${nextInSeries.id}`} className="link-btn">
            {formatDateTime(nextInSeries.startAt)}
          </Link>
        </p>
      )}

      <div className="event-detail__grid">
        <div className="event-detail__col">
          {!closed && <GraceCountdown event={event} phase={phase} />}

          {/* Commitment */}
          {!closed && myMember && !myMember.excused && (
            <section className="card commit-card">
              {myMember.status === 'invited' && (
                <>
                  <h2>Join this event</h2>
                  <p className="muted">
                    Commit <strong>{formatMoney(event.amount)}</strong>. It moves from your Starling account into your Show up! Commitments
                    Space. Check in on time and it comes back — plus a share of anyone who doesn’t show.
                  </p>
                  {me.starling ? (
                    <div className="commit-card__balances">
                      <span>
                        Starling ••••{me.starling.accountLast4} <strong>{formatMoney(me.balance)}</strong>
                      </span>
                      <span>
                        Show up! Space <strong>{formatMoney(me.held)}</strong>
                      </span>
                    </div>
                  ) : (
                    <div className="commit-card__connect">
                      <Landmark size={18} /> Connect your Starling account to commit.
                    </div>
                  )}
                  {canCommitInPhase(phase) ? (
                    <div className="commit-card__actions">
                      <button
                        type="button"
                        className="btn btn--primary btn--lg"
                        onClick={() => (me.starling ? setConfirmCommit(true) : setConnecting(true))}
                      >
                        {me.starling ? `Join & commit ${formatMoney(event.amount)}` : 'Connect Starling to commit'}
                      </button>
                      <button type="button" className="btn btn--ghost" onClick={() => decline(event.id)}>
                        Decline
                      </button>
                    </div>
                  ) : (
                    <p className="form-error">Commitments closed when the event started.</p>
                  )}
                </>
              )}
              {myMember.status === 'committed' && (
                <div className="commit-card__held">
                  <ShieldCheck size={26} />
                  <div>
                    <strong>{formatMoney(event.amount)} held in your Show up! Space</strong>
                    <span className="muted small">
                      Sitting in your Starling account · ref {eventReference(event)}. Check in within {event.radius}m of the venue
                      to get it back.
                    </span>
                  </div>
                </div>
              )}
              {myMember.status === 'declined' && (
                <div className="commit-card__held commit-card__held--muted">
                  <div>
                    <strong>You declined</strong>
                    <span className="muted small">Changed your mind?</span>
                  </div>
                  {canCommitInPhase(phase) && (
                    <button type="button" className="btn btn--soft btn--sm" onClick={() => (me.starling ? setConfirmCommit(true) : setConnecting(true))}>
                      Join & commit {formatMoney(event.amount)}
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          {myMember?.status === 'committed' && (!closed || myMember.excused) && <DelayProtectionCard event={event} />}
          {!closed && myMember?.status === 'committed' && !myMember.excused && <CheckInPanel event={event} />}
          {isAdmin && !closed && <DemoControls event={event} phase={phase} />}
          {event.settled && canShareMemories(event, ME_ID) && <EventMemory event={event} onAdd={() => setAddingPhotos(true)} />}
        </div>

        <div className="event-detail__col">
          <MemberList event={event} phase={phase} onAddPeople={() => setAddingPeople(true)} />
        </div>
      </div>

      {editing && <EventForm event={event} onClose={() => setEditing(false)} />}
      {addingPeople && <AddPeopleModal event={event} onClose={() => setAddingPeople(false)} />}
      {addingPhotos && <AddPhotosModal eventId={event.id} title={event.title} onClose={() => setAddingPhotos(false)} />}
      {cancelling && <CancelEventModal event={event} onClose={() => setCancelling(false)} />}
      {confirmCommit && <CommitModal event={event} onClose={() => setConfirmCommit(false)} />}
      {connecting && <StarlingConnectModal onClose={() => setConnecting(false)} onConnected={() => setConfirmCommit(true)} />}
      {confirmDelete && (
        <ConfirmModal
          title={`Delete ${event.title}?`}
          message={event.settled ? 'This removes the event. Your memory of it stays.' : 'This removes the event for everyone. It can’t be undone.'}
          confirmLabel="Delete event"
          danger
          onConfirm={() => {
            deleteEvent(event.id)
            navigate('/dashboard')
          }}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
