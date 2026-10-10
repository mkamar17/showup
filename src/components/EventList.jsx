import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import EventCard from './EventCard'

export default function EventList({ events, onCreate }) {
  const [tab, setTab] = useState('upcoming')
  const upcoming = events.filter((e) => !e.settled).sort((a, b) => a.startAt - b.startAt)
  const past = events.filter((e) => e.settled).sort((a, b) => b.startAt - a.startAt)
  const list = tab === 'upcoming' ? upcoming : past

  return (
    <div className="event-list">
      <div className="segmented segmented--small">
        <button type="button" className={tab === 'upcoming' ? 'is-active' : ''} onClick={() => setTab('upcoming')}>
          Upcoming ({upcoming.length})
        </button>
        <button type="button" className={tab === 'past' ? 'is-active' : ''} onClick={() => setTab('past')}>
          Past ({past.length})
        </button>
      </div>
      {list.length === 0 ? (
        <div className="empty-state">
          <CalendarDays size={32} />
          <p>{tab === 'upcoming' ? 'No upcoming events yet.' : 'No past events yet.'}</p>
          {tab === 'upcoming' && (
            <button type="button" className="btn btn--primary" onClick={onCreate}>
              Create your first event
            </button>
          )}
        </div>
      ) : (
        <div className="event-grid">
          {list.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  )
}
