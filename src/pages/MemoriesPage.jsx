import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Images, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../api/useApp'
import { formatDate, formatMoney } from '../api/format'
import ActivityIcon from '../components/ActivityIcon'
import { AvatarStack } from '../components/Avatar'
import ConfirmModal from '../components/ConfirmModal'
import '../styles/memories.css'

function MemoryCard({ memory }) {
  const { state, updateMemory, deleteMemory } = useApp()
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState(memory.note)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const users = (ids) => ids.map((id) => state.users[id]).filter(Boolean)

  return (
    <article className="memory-card">
      <div className="memory-card__top">
        <span className="memory-card__icon">
          <ActivityIcon activity={memory.activity} size={24} />
        </span>
        <div>
          <h3>{memory.title}</h3>
          <p className="muted small">
            {formatDate(memory.date, { weekday: 'long', day: 'numeric', month: 'long' })} · {memory.venueName}
          </p>
        </div>
        <span className={`amount ${memory.myResult > 0 ? 'amount--plus' : memory.myResult < 0 ? 'amount--minus' : ''}`}>
          {memory.myResult === 0 ? '±£0.00' : formatMoney(memory.myResult, { sign: true })}
        </span>
      </div>

      <div className="memory-card__people">
        <div>
          <small>Showed up</small>
          {memory.attendees.length ? <AvatarStack users={users(memory.attendees)} /> : <span className="muted small">Nobody</span>}
        </div>
        {memory.noShows.length > 0 && (
          <div>
            <small>No-shows</small>
            <AvatarStack users={users(memory.noShows)} />
          </div>
        )}
      </div>

      {editing ? (
        <div className="memory-card__edit">
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} placeholder="Add a note…" autoFocus />
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
      ) : (
        <p className={`memory-card__note${memory.note ? '' : ' is-empty'}`}>{memory.note || 'No note yet — add one to remember the day.'}</p>
      )}

      <div className="memory-card__actions">
        {state.events.some((e) => e.id === memory.eventId) && (
          <Link to={`/events/${memory.eventId}/settlement`} className="link-btn">
            Settlement
          </Link>
        )}
        <button type="button" className="icon-btn icon-btn--outline" onClick={() => setEditing(true)} aria-label="Edit note">
          <Pencil size={15} />
        </button>
        <button type="button" className="icon-btn icon-btn--outline" onClick={() => setConfirmDelete(true)} aria-label="Delete memory">
          <Trash2 size={15} />
        </button>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete this memory?"
          message="The settlement record stays; only this memory card is removed."
          confirmLabel="Delete"
          danger
          onConfirm={() => deleteMemory(memory.id)}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </article>
  )
}

export default function MemoriesPage() {
  const { state } = useApp()
  const memories = [...state.memories].sort((a, b) => b.date - a.date)

  return (
    <div className="memories">
      <p className="muted">Every settled event becomes a memory — who turned up, who didn’t, and how it went.</p>
      {memories.length === 0 ? (
        <div className="empty-state">
          <Images size={32} />
          <p>No memories yet. They appear here after an event is settled.</p>
        </div>
      ) : (
        <div className="memories__grid">
          {memories.map((m) => (
            <MemoryCard key={m.id} memory={m} />
          ))}
        </div>
      )}
    </div>
  )
}
