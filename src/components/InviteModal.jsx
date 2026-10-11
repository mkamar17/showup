import { useState } from 'react'
import { useApp } from '../api/useApp'
import { isClosed } from '../api/eventLogic'
import { ME_ID } from '../api/constants'
import { formatDateTime } from '../api/format'
import Modal from './Modal'
import Avatar from './Avatar'
import ActivityIcon from './ActivityIcon'

// Admin adds more friends to an existing event.
export function AddPeopleModal({ event, onClose }) {
  const { state, inviteToEvent } = useApp()
  const [selected, setSelected] = useState([])
  const candidates = state.friends.filter((id) => !event.members[id]).map((id) => state.users[id])
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  return (
    <Modal
      title={`Add people to ${event.title}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!selected.length}
            onClick={() => {
              inviteToEvent(event.id, selected)
              onClose()
            }}
          >
            Invite {selected.length || ''}
          </button>
        </>
      }
    >
      {candidates.length === 0 ? (
        <p className="muted">All your friends are already in this group. Add more friends from Community.</p>
      ) : (
        <div className="invite-grid">
          {candidates.map((u) => (
            <button key={u.id} type="button" className={`invite-option${selected.includes(u.id) ? ' is-selected' : ''}`} onClick={() => toggle(u.id)}>
              <Avatar user={u} size={30} />
              <span>{u.name}</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}

// Invite one friend to one of your (admin) events.
export function InviteFriendModal({ friend, onClose }) {
  const { state, inviteToEvent } = useApp()
  const events = state.events
    .filter((e) => e.adminId === ME_ID && !isClosed(e) && !e.members[friend.id])
    .sort((a, b) => a.startAt - b.startAt)

  return (
    <Modal title={`Invite ${friend.name}`} onClose={onClose}>
      {events.length === 0 ? (
        <p className="muted">You don’t have any upcoming events they aren’t already in. Create an event from Home first.</p>
      ) : (
        <ul className="pick-list">
          {events.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => {
                  inviteToEvent(e.id, [friend.id])
                  onClose()
                }}
              >
                <span className="dropdown__icon">
                  <ActivityIcon activity={e.activity} size={16} />
                </span>
                <span>
                  <strong>{e.title}</strong>
                  <small>{formatDateTime(e.startAt)}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
