import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { isClosed } from '../api/eventLogic'
import EventCard from './EventCard'
import HistoryCard from './HistoryCard'

export default function EventList({ events, onCreate }) {
  const [tab, setTab] = useState('upcoming')
  const upcoming = events.filter((e) => !isClosed(e)).sort((a, b) => a.startAt - b.startAt)
  const past = events.filter(isClosed).sort((a, b) => b.startAt - a.startAt)
  const list = tab === 'upcoming' ? upcoming : past

  return (
    <div className="event-list">
      <div className="segmented segmented--small">
        <button type="button" className={tab === 'upcoming' ? 'is-active' : ''} onClick={() => setTab('upcoming')}>
          Upcoming ({upcoming.length})
        </button>
        <button type="button" className={tab === 'past' ? 'is-active' : ''} onClick={() => setTab('past')}>
          History ({past.length})
        </button>
      </div>
      {list.length === 0 ? (
        <div className="empty-state">
          <CalendarDays size={32} />
          <p>{tab === 'upcoming' ? 'No upcoming events yet.' : 'Events you’ve taken part in will show up here.'}</p>
          {tab === 'upcoming' && (
            <button type="button" className="btn btn--primary" onClick={onCreate}>
              Create your first event
            </button>
          )}
        </div>
      ) : (
        <div className={`event-grid${tab === 'upcoming' ? '' : ' event-grid--history'}`}>
          {list.map((e) => (tab === 'upcoming' ? <EventCard key={e.id} event={e} /> : <HistoryCard key={e.id} event={e} />))}
        </div>
      )}
    </div>
  )
}
