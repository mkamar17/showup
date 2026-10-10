import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Users } from 'lucide-react'
import { useApp } from '../api/useApp'
import { relativeTime } from '../api/format'
import Avatar from './Avatar'

export default function FriendsPanel() {
  const { state, now, toast } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState('activities')
  const friends = state.friends.map((id) => state.users[id])
  const list = tab === 'online' ? friends.filter((f) => f.online) : [...friends].sort((a, b) => b.lastActiveAt - a.lastActiveAt)

  return (
    <section className="panel friends-panel">
      <div className="panel__head">
        <h2>
          <Users size={20} /> Friends
        </h2>
        <button type="button" className="link-btn" onClick={() => navigate('/community')}>
          View all
        </button>
      </div>
      <div className="segmented segmented--pill">
        <button type="button" className={tab === 'activities' ? 'is-active' : ''} onClick={() => setTab('activities')}>
          Activities
        </button>
        <button type="button" className={tab === 'online' ? 'is-active' : ''} onClick={() => setTab('online')}>
          Online
        </button>
      </div>
      {list.length === 0 && (
        <p className="muted small">
          {friends.length ? 'No friends online right now.' : 'No friends yet.'}{' '}
          <button type="button" className="link-btn" onClick={() => navigate('/community')}>
            Add friends
          </button>
        </p>
      )}
      <ul className="friend-rows">
        {list.map((f) => (
          <li key={f.id}>
            <span className="friend-rows__avatar">
              <Avatar user={f} size={44} />
              {f.online && <i className="online-dot" />}
            </span>
            <span className="friend-rows__text">
              <strong>{f.name}</strong>
              <small>{f.activity}</small>
              <small className="faint">{relativeTime(f.lastActiveAt, now)}</small>
            </span>
            <button type="button" className="icon-btn icon-btn--outline" onClick={() => toast(`Messaging ${f.name} isn't part of this prototype yet`)} aria-label={`Message ${f.name}`}>
              <Mail size={16} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
