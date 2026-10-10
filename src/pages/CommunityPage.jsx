import { useState } from 'react'
import { AtSign, CalendarPlus, Copy, UserMinus, UserPlus } from 'lucide-react'
import { useApp } from '../api/useApp'
import { ME_ID } from '../api/constants'
import Avatar from '../components/Avatar'
import ConfirmModal from '../components/ConfirmModal'
import { InviteFriendModal } from '../components/InviteModal'
import '../styles/community.css'

export default function CommunityPage() {
  const { state, me, addFriend, removeFriend, toast } = useApp()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState(null)
  const [inviting, setInviting] = useState(null)

  const friends = state.friends.map((id) => state.users[id])
  const suggestions = Object.values(state.users).filter((u) => u.id !== ME_ID && !state.friends.includes(u.id))

  const sharedEvents = (id) => state.events.filter((e) => e.members[id] && e.members[ME_ID]).length

  function submit(e) {
    e.preventDefault()
    const result = addFriend(username)
    if (result.ok) {
      setUsername('')
      setError('')
    } else {
      setError(result.message)
    }
  }

  async function copyUsername() {
    try {
      await navigator.clipboard.writeText(`@${me.username}`)
      toast('Username copied — share it with friends', 'success')
    } catch {
      toast(`Your username is @${me.username}`)
    }
  }

  return (
    <div className="community">
      <section className="card community__add">
        <div>
          <h2>Add friends</h2>
          <p className="muted">Find friends by their username. Friends can be invited to your events.</p>
        </div>
        <form className="community__form" onSubmit={submit}>
          <div className="input-icon">
            <AtSign size={16} />
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError('')
              }}
              placeholder="username, e.g. codybryan"
              autoCapitalize="none"
              aria-label="Friend's username"
            />
          </div>
          <button type="submit" className="btn btn--primary">
            <UserPlus size={17} /> Add
          </button>
        </form>
        {error && <p className="form-error">{error}</p>}
        <button type="button" className="community__me" onClick={copyUsername}>
          Your username: <strong>@{me.username}</strong> <Copy size={14} />
        </button>
      </section>

      <div className="community__grid">
        <section className="card">
          <h3 className="card__title">Your friends ({friends.length})</h3>
          {friends.length === 0 && <p className="muted small">No friends yet — add someone by username.</p>}
          <ul className="people-rows">
            {friends.map((f) => (
              <li key={f.id}>
                <span className="friend-rows__avatar">
                  <Avatar user={f} size={46} />
                  {f.online && <i className="online-dot" />}
                </span>
                <span className="people-rows__text">
                  <strong>{f.name}</strong>
                  <small>
                    @{f.username} · {sharedEvents(f.id)} shared event{sharedEvents(f.id) === 1 ? '' : 's'}
                  </small>
                </span>
                <span className="people-rows__actions">
                  <button type="button" className="btn btn--soft btn--sm" onClick={() => setInviting(f)}>
                    <CalendarPlus size={15} /> <span className="hide-sm">Invite</span>
                  </button>
                  <button type="button" className="icon-btn icon-btn--outline" onClick={() => setRemoving(f)} aria-label={`Remove ${f.name}`}>
                    <UserMinus size={16} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h3 className="card__title">People you may know</h3>
          {suggestions.length === 0 && <p className="muted small">You’re friends with everyone in the demo!</p>}
          <ul className="people-rows">
            {suggestions.map((u) => (
              <li key={u.id}>
                <Avatar user={u} size={46} />
                <span className="people-rows__text">
                  <strong>{u.name}</strong>
                  <small>@{u.username}</small>
                </span>
                <button type="button" className="btn btn--primary btn--sm" onClick={() => addFriend(u.username)}>
                  <UserPlus size={15} /> Add
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {removing && (
        <ConfirmModal
          title={`Remove ${removing.name}?`}
          message="They’ll stay in any events they’ve already joined."
          confirmLabel="Remove friend"
          danger
          onConfirm={() => removeFriend(removing.id)}
          onClose={() => setRemoving(null)}
        />
      )}
      {inviting && <InviteFriendModal friend={inviting} onClose={() => setInviting(null)} />}
    </div>
  )
}
