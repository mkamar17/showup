import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, List, Plus } from 'lucide-react'
import { useApp } from '../api/useApp'
import { ME_ID } from '../api/constants'
import EventList from '../components/EventList'
import EventCalendar from '../components/EventCalendar'
import EventForm from '../components/EventForm'
import NextUpCard from '../components/NextUpCard'
import HeldCard from '../components/HeldCard'
import LiveMapCard from '../components/LiveMapCard'
import '../styles/dashboard.css'

export default function LandingPage() {
  const { state } = useApp()
  const navigate = useNavigate()
  const [view, setView] = useState('list')
  const [creating, setCreating] = useState(false)

  const myEvents = state.events.filter((e) => e.members[ME_ID] || e.adminId === ME_ID)

  return (
    <div className="dashboard">
      {/* Top bar: title on the left, view toggle + create on the far right */}
      <header className="events-section__head dashboard__head">
        <h2>Your events</h2>
        <div className="events-section__actions">
          <div className="segmented segmented--icons" role="tablist" aria-label="Event view">
            <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-label="List view">
              <List size={16} /> <span>List</span>
            </button>
            <button type="button" className={view === 'calendar' ? 'is-active' : ''} onClick={() => setView('calendar')} aria-label="Calendar view">
              <CalendarDays size={16} /> <span>Calendar</span>
            </button>
          </div>
          <button type="button" className="btn btn--primary" onClick={() => setCreating(true)}>
            <Plus size={18} /> <span className="hide-sm">Create event</span>
          </button>
        </div>
      </header>

      <section className="events-section">
        {view === 'list' ? <EventList events={myEvents} onCreate={() => setCreating(true)} /> : <EventCalendar events={myEvents} />}
      </section>

      <aside className="dashboard__side">
        <NextUpCard onCreate={() => setCreating(true)} />
        <HeldCard />
        <LiveMapCard />
      </aside>

      {creating && <EventForm onClose={() => setCreating(false)} onSaved={(id) => navigate(`/events/${id}`)} />}
    </div>
  )
}
