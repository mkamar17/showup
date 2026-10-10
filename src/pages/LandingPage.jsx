import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, List, Plus } from 'lucide-react'
import { useApp } from '../api/useApp'
import { ME_ID } from '../api/constants'
import OverviewCard from '../components/OverviewCard'
import SpotlightCards from '../components/SpotlightCards'
import EventList from '../components/EventList'
import EventCalendar from '../components/EventCalendar'
import EventForm from '../components/EventForm'
import FriendsPanel from '../components/FriendsPanel'
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
      <div className="dashboard__main">
        <div className="dashboard__top">
          <OverviewCard />
          <SpotlightCards onCreate={() => setCreating(true)} />
        </div>

        <section className="events-section">
          <div className="events-section__head">
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
          </div>
          {view === 'list' ? <EventList events={myEvents} onCreate={() => setCreating(true)} /> : <EventCalendar events={myEvents} />}
        </section>
      </div>

      <aside className="dashboard__side">
        <FriendsPanel />
        <LiveMapCard />
      </aside>

      {creating && <EventForm onClose={() => setCreating(false)} onSaved={(id) => navigate(`/events/${id}`)} />}
    </div>
  )
}
