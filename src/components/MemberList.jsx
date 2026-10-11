import { Crown, UserPlus } from 'lucide-react'
import { useApp } from '../api/useApp'
import { ME_ID } from '../api/constants'
import { canCommitInPhase, canMemberCheckIn, heldTotal, isClosed } from '../api/eventLogic'
import { formatMoney, formatTime } from '../api/format'
import { offsetNorth, distanceMetres } from '../api/geo'
import Avatar from './Avatar'
import { MemberPill } from './StatusPill'

function memberStatus(event, id) {
  const m = event.members[id]
  if (event.cancelled && m.status === 'committed') return 'refunded'
  if (m.excused) return 'excused'
  if (event.settled && m.status === 'committed') return m.checkedInAt ? 'checkedIn' : 'noShow'
  if (m.checkedInAt) return 'checkedIn'
  if (m.extendedUntil) return 'delayed'
  return m.status
}

export default function MemberList({ event, phase, onAddPeople }) {
  const { state, now, commit, checkIn, simulateFriendTransport } = useApp()
  const ids = Object.keys(event.members).sort((a, b) => (a === event.adminId ? -1 : b === event.adminId ? 1 : 0))
  const isAdmin = event.adminId === ME_ID

  // Simulated friends "arrive" a short random distance from the venue.
  const simulateFriendCheckIn = (id) => {
    const spot = offsetNorth(event.venue, Math.round(Math.random() * event.radius * 0.6))
    checkIn(event.id, id, Math.round(distanceMetres(spot, event.venue)))
  }

  return (
    <section className="card members">
      <div className="card__head">
        <h2>Group ({ids.length})</h2>
        {isAdmin && !isClosed(event) && (
          <button type="button" className="btn btn--soft btn--sm" onClick={onAddPeople}>
            <UserPlus size={15} /> Add people
          </button>
        )}
      </div>
      <p className="members__pot">
        <span>{event.cancelled ? 'Returned' : 'Total held'}</span>
        <strong>{formatMoney(heldTotal(event))}</strong>
      </p>
      <ul className="member-rows">
        {ids.map((id) => {
          const user = state.users[id]
          const m = event.members[id]
          const status = memberStatus(event, id)
          const showSim = id !== ME_ID && !isClosed(event)
          return (
            <li key={id}>
              <Avatar user={user} size={40} />
              <span className="member-rows__text">
                <strong>
                  {id === ME_ID ? `${user.name} (you)` : user.name}
                  {id === event.adminId && <Crown size={13} className="accent" aria-label="Admin" />}
                </strong>
                <small>
                  @{user.username}
                  {m.checkedInAt ? ` · in at ${formatTime(m.checkedInAt)}` : ''}
                  {m.excused ? ` · ${m.excused.lineName}: ${m.excused.label}` : ''}
                </small>
              </span>
              <span className="member-rows__actions">
                <MemberPill status={status} />
                {showSim && m.status === 'invited' && canCommitInPhase(phase) && (
                  <button type="button" className="btn btn--ghost btn--xs" onClick={() => commit(event.id, id)} title="Demo: simulate this friend committing">
                    Simulate commit
                  </button>
                )}
                {showSim && canMemberCheckIn(event, id, now) && (
                  <>
                    <button type="button" className="btn btn--ghost btn--xs" onClick={() => simulateFriendCheckIn(id)} title="Demo: simulate this friend arriving and checking in">
                      Simulate check-in
                    </button>
                    <button type="button" className="btn btn--ghost btn--xs" onClick={() => simulateFriendTransport(event.id, id)} title="Demo: this friend’s tube line is suspended">
                      Simulate TfL suspension
                    </button>
                  </>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
