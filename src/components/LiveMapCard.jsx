import { useNavigate } from 'react-router-dom'
import { MapPinned } from 'lucide-react'
import { useApp } from '../api/useApp'
import { ME_ID } from '../api/constants'
import { distanceMetres } from '../api/geo'
import MapView from './MapView'

export default function LiveMapCard() {
  const { state, location } = useApp()
  const navigate = useNavigate()
  const next = state.events
    .filter((e) => !e.settled && e.members[ME_ID]?.status !== 'declined' && e.members[ME_ID])
    .sort((a, b) => a.startAt - b.startAt)[0]

  return (
    <section className="panel live-map">
      <div className="panel__head">
        <h2>
          <MapPinned size={20} /> Live map
        </h2>
        {next && (
          <button type="button" className="link-btn" onClick={() => navigate(`/events/${next.id}`)}>
            View
          </button>
        )}
      </div>
      {next ? (
        <>
          <MapView
            venue={next.venue}
            radius={next.radius}
            user={location}
            height={190}
            inRadius={location ? distanceMetres(location, next.venue) <= next.radius : false}
          />
          <p className="muted small">
            {next.title} · {next.venue.name} · {next.radius}m check-in radius
          </p>
        </>
      ) : (
        <p className="muted small">Your next event's venue will show here.</p>
      )}
    </section>
  )
}
