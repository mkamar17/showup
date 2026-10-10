// Location-gated check-in: the button only unlocks inside the event radius.
import { CircleCheck, Lock, LocateFixed, Navigation, Unlock } from 'lucide-react'
import { useApp } from '../api/useApp'
import { ME_ID, CHECKIN_EARLY_MINUTES } from '../api/constants'
import { canCheckInPhase } from '../api/eventLogic'
import { distanceMetres, offsetNorth } from '../api/geo'
import { formatDistance, formatTime, timeUntil } from '../api/format'
import MapView from './MapView'

export default function CheckInPanel({ event, phase }) {
  const { now, location, locationStatus, locationError, requestGps, simulateLocation, checkIn } = useApp()
  const member = event.members[ME_ID]
  const distance = location ? distanceMetres(location, event.venue) : null
  const inRadius = distance !== null && distance <= event.radius
  const windowOpen = canCheckInPhase(phase)
  const checkedIn = Boolean(member?.checkedInAt)

  let message
  if (checkedIn) {
    message = `Checked in at ${formatTime(member.checkedInAt)}${member.checkInDistance != null ? ` · ${formatDistance(member.checkInDistance)} from the venue` : ''}. Your commitment comes back after settlement.`
  } else if (!location) {
    message = locationStatus === 'locating' ? 'Finding your location…' : 'Share your location so Engine can confirm you’re at the venue.'
  } else if (!inRadius) {
    message = `You’re ${formatDistance(distance)} away — check-in unlocks within ${event.radius}m.`
  } else if (!windowOpen) {
    message = `You’re at the venue! Check-in opens ${CHECKIN_EARLY_MINUTES} min before the start (in ${timeUntil(event.startAt - CHECKIN_EARLY_MINUTES * 60000, now)}).`
  } else {
    message = `You’re ${formatDistance(distance)} from ${event.venue.name}. Check in now.`
  }

  return (
    <section className="card checkin">
      <div className="card__head">
        <h2>Check in</h2>
        <span className={`pill ${checkedIn ? 'pill--success' : inRadius ? 'pill--success-soft' : 'pill--pink-soft'}`}>
          {checkedIn ? 'Checked in' : inRadius ? 'Inside radius' : location ? 'Outside radius' : 'Location off'}
        </span>
      </div>

      <MapView venue={event.venue} radius={event.radius} user={location} height={240} inRadius={inRadius} />

      <p className={`checkin__message${checkedIn ? ' is-success' : inRadius ? ' is-ok' : ''}`}>
        {checkedIn ? <CircleCheck size={18} /> : inRadius && windowOpen ? <Unlock size={18} /> : <Lock size={18} />}
        <span>{message}</span>
      </p>
      {locationError && <p className="form-error">{locationError}</p>}

      {!checkedIn && (
        <>
          <button
            type="button"
            className="btn btn--primary btn--block btn--lg"
            disabled={!inRadius || !windowOpen}
            onClick={() => checkIn(event.id, ME_ID, Math.round(distance))}
          >
            <CircleCheck size={18} /> Check in
          </button>
          <div className="checkin__location">
            <button type="button" className="btn btn--soft btn--sm" onClick={requestGps}>
              <LocateFixed size={15} /> {location?.source === 'gps' ? 'Refresh GPS' : 'Use my GPS'}
            </button>
            <button type="button" className="btn btn--soft btn--sm" onClick={() => simulateLocation(offsetNorth(event.venue, 18))}>
              <Navigation size={15} /> Simulate arrival
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => simulateLocation(offsetNorth(event.venue, 420))}>
              Simulate 420m away
            </button>
          </div>
          <p className="muted small">
            {location
              ? location.source === 'simulated'
                ? 'Using a simulated location (demo).'
                : `Live GPS · accurate to ±${Math.round(location.accuracy)}m`
              : 'Uses your browser’s location, or simulate it for the demo.'}
          </p>
        </>
      )}
    </section>
  )
}
