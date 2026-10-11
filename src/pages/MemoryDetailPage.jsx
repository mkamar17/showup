// One event's memory: the event's context, then every photo the people who
// joined have added. Only those people can open it.
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, ImagePlus, Lock, MapPin, Pencil, Users } from 'lucide-react'
import { useApp } from '../api/useApp'
import { ME_ID } from '../api/constants'
import { photosForEvent, visibleMemories } from '../api/eventLogic'
import { formatDate } from '../api/format'
import ActivityIcon from '../components/ActivityIcon'
import { AvatarStack } from '../components/Avatar'
import AddPhotosModal from '../components/AddPhotosModal'
import { PhotoGrid } from '../components/MemoryPhotos'
import '../styles/memories.css'

function Caption({ memory }) {
  const { updateMemory } = useApp()
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState(memory.note)

  if (editing) {
    return (
      <div className="memory-caption memory-caption--editing">
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} placeholder="Score, highlights, who owes a rematch…" autoFocus />
        <div>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => {
              updateMemory(memory.id, note.trim())
              setEditing(false)
            }}
          >
            Save
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setNote(memory.note)
              setEditing(false)
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }
  return (
    <button type="button" className={`memory-caption${memory.note ? '' : ' is-empty'}`} onClick={() => setEditing(true)}>
      <span>{memory.note ? `“${memory.note}”` : 'Add a line about the day…'}</span>
      <Pencil size={14} />
    </button>
  )
}

export default function MemoryDetailPage() {
  const { eventId } = useParams()
  const { state } = useApp()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)

  const memory = visibleMemories(state.memories, ME_ID).find((m) => m.eventId === eventId)
  const event = state.events.find((e) => e.id === eventId)

  if (!memory) {
    return (
      <div className="empty-state memory-locked">
        <Lock size={30} />
        <strong>This memory is private</strong>
        <p>Only people who joined the event can see its photos.</p>
        <Link to="/memories" className="btn btn--primary">
          Back to memories
        </Link>
      </div>
    )
  }

  const photos = photosForEvent(state.photos, eventId)
  const users = (ids) => ids.map((id) => state.users[id]).filter(Boolean)
  const contributors = [...new Set(photos.map((p) => p.uploadedBy))]
  const names = contributors.map((id) => (id === ME_ID ? 'you' : state.users[id]?.name.split(' ')[0])).filter(Boolean)
  const byLine = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]

  return (
    <div className="memory-detail">
      <button type="button" className="link-btn back-link" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <header className="memory-detail__head card">
        <span className="memory-detail__icon">
          <ActivityIcon activity={memory.activity} size={28} />
        </span>
        <div className="memory-detail__info">
          <h2>{memory.title}</h2>
          <ul className="memory-detail__meta">
            <li>
              <CalendarDays size={15} /> {formatDate(memory.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </li>
            <li>
              <MapPin size={15} /> {memory.venueName}
            </li>
            <li>
              <Users size={15} /> {memory.attendees.length} showed up <AvatarStack users={users(memory.attendees)} size={24} max={5} />
            </li>
          </ul>
          <Caption key={memory.note} memory={memory} />
        </div>
        <div className="memory-detail__actions">
          <button type="button" className="btn btn--primary" onClick={() => setAdding(true)}>
            <ImagePlus size={17} /> Add photos
          </button>
          {event && (
            <Link to={`/events/${event.id}`} className="btn btn--ghost">
              Event details
            </Link>
          )}
        </div>
      </header>

      {photos.length === 0 ? (
        <div className="empty-state">
          <ImagePlus size={30} />
          <strong>No photos yet</strong>
          <p>Be the first to add some from the day. Everyone who joined will see them.</p>
          <button type="button" className="btn btn--primary" onClick={() => setAdding(true)}>
            Add photos
          </button>
        </div>
      ) : (
        <section className="memory-detail__photos">
          <p className="muted small">
            {photos.length} photo{photos.length === 1 ? '' : 's'} from {byLine}
            {photos.some((p) => p.sample) && ' · sample images for the demo'}
          </p>
          <PhotoGrid photos={photos} adminId={event?.adminId} />
        </section>
      )}

      {adding && <AddPhotosModal eventId={eventId} title={memory.title} onClose={() => setAdding(false)} />}
    </div>
  )
}
