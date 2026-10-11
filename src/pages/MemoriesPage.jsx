// Memories: the photos people captured at the events they joined. Every event
// is its own collection automatically; there are no albums to manage.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ImagePlus, Images } from 'lucide-react'
import { useApp } from '../api/useApp'
import { ME_ID } from '../api/constants'
import { photosForEvent, visibleMemories } from '../api/eventLogic'
import { formatDate } from '../api/format'
import ActivityIcon from '../components/ActivityIcon'
import { AvatarStack } from '../components/Avatar'
import AddPhotosModal from '../components/AddPhotosModal'
import { PhotoStrip } from '../components/MemoryPhotos'
import '../styles/memories.css'

function MemoryCard({ memory, photos }) {
  const { state } = useApp()
  const contributors = [...new Set(photos.map((p) => p.uploadedBy))].map((id) => state.users[id]).filter(Boolean)

  return (
    <Link to={`/memories/${memory.eventId}`} className="memory-card">
      <PhotoStrip photos={photos} max={3} variant="mosaic" />
      <div className="memory-card__body">
        <h3>{memory.title}</h3>
        <p className="muted small">
          {formatDate(memory.date, { weekday: 'short', day: 'numeric', month: 'long' })} · {memory.venueName}
        </p>
        {memory.note && <p className="memory-card__note">“{memory.note}”</p>}
        <div className="memory-card__foot">
          <span className="memory-card__people">
            <AvatarStack users={contributors} size={26} max={4} />
            <span className="muted small">
              {photos.length} photo{photos.length === 1 ? '' : 's'} · {memory.attendees.length} showed up
            </span>
          </span>
          <span className="memory-card__open">
            View <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function MemoriesPage() {
  const { state } = useApp()
  const [adding, setAdding] = useState(null)
  const memories = visibleMemories(state.memories, ME_ID).map((m) => ({ memory: m, photos: photosForEvent(state.photos, m.eventId) }))
  const withPhotos = memories.filter((m) => m.photos.length)
  // Recent events nobody has added photos to yet (only ones that still exist).
  const waiting = memories.filter((m) => !m.photos.length && state.events.some((e) => e.id === m.memory.eventId)).slice(0, 3)

  // Group by month, newest first: the shape a yearly recap can build on later.
  const months = []
  withPhotos.forEach((m) => {
    const label = formatDate(m.memory.date, { month: 'long', year: 'numeric' })
    const group = months.at(-1)
    if (group?.label === label) group.items.push(m)
    else months.push({ label, items: [m] })
  })

  return (
    <div className="memories">
      <header className="memories__head">
        <h2>Memories</h2>
        <p className="muted">Moments worth keeping, captured by everyone who showed up.</p>
      </header>

      {waiting.length > 0 && (
        <section className="memory-nudge">
          <h3>
            <ImagePlus size={18} /> Got photos from these?
          </h3>
          <ul>
            {waiting.map(({ memory }) => (
              <li key={memory.id}>
                <span className="memory-nudge__icon">
                  <ActivityIcon activity={memory.activity} size={18} />
                </span>
                <Link to={`/memories/${memory.eventId}`} className="memory-nudge__text">
                  <strong>{memory.title}</strong>
                  <small>{formatDate(memory.date, { weekday: 'short', day: 'numeric', month: 'short' })}</small>
                </Link>
                <button type="button" className="btn btn--soft btn--sm" onClick={() => setAdding(memory)}>
                  Add photos
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {withPhotos.length === 0 ? (
        <div className="empty-state">
          <Images size={32} />
          <strong>No memories yet</strong>
          <p>Show up to an event, take some photos, and they’ll appear here.</p>
          {waiting.length === 0 && (
            <Link to="/dashboard" className="btn btn--primary">
              View events
            </Link>
          )}
        </div>
      ) : (
        months.map((group) => (
          <section key={group.label} className="memories__month">
            <h3 className="memories__month-label">{group.label}</h3>
            <div className="memories__grid">
              {group.items.map(({ memory, photos }) => (
                <MemoryCard key={memory.id} memory={memory} photos={photos} />
              ))}
            </div>
          </section>
        ))
      )}

      {adding && <AddPhotosModal eventId={adding.eventId} title={adding.title} onClose={() => setAdding(null)} />}
    </div>
  )
}
