import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CircleCheck, Clock, Heart, Repeat } from 'lucide-react'
import { useApp } from '../api/useApp'
import { ME_ID, PAYMENT_SETTLE_MS } from '../api/constants'
import { formatDateTime, formatMoney } from '../api/format'
import { eventReference } from '../api/eventLogic'
import Avatar from '../components/Avatar'
import '../styles/starling.css'
import '../styles/settlement.css'

export default function SettlementPage() {
  const { eventId } = useParams()
  const { state, now, updateMemory } = useApp()
  const event = state.events.find((e) => e.id === eventId)
  const memory = state.memories.find((m) => m.eventId === eventId)
  const [note, setNote] = useState(memory?.note ?? '')

  if (!event || !event.settled) {
    return (
      <div className="empty-state">
        <p>{event ? 'This event hasn’t been settled yet.' : 'Event not found.'}</p>
        <Link to={event ? `/events/${eventId}` : '/'} className="btn btn--primary">
          Go back
        </Link>
      </div>
    )
  }

  const s = event.settlement
  const user = (id) => state.users[id]
  const nameOf = (id) => (id === ME_ID ? 'You' : user(id).name)
  const penaltyShare = (id) => (s.payouts[id] || 0) - event.amount
  const nextInSeries = state.events.find((e) => e.seriesId === event.seriesId && e.startAt > event.startAt)

  return (
    <div className="settlement">
      <Link to={`/events/${event.id}`} className="link-btn back-link">
        <ArrowLeft size={16} /> Back to event
      </Link>

      <header className="settlement__hero">
        <span className="settlement__check">
          <CircleCheck size={34} />
        </span>
        <div>
          <span className="pill pill--light">Settlement complete</span>
          <h2>{event.title}</h2>
          <p>
            {formatDateTime(event.startAt)} · {event.venue.name}
          </p>
        </div>
        <dl className="settlement__summary">
          <div>
            <dt>Committed</dt>
            <dd>
              {s.committed.length} × {formatMoney(event.amount)}
            </dd>
          </div>
          <div>
            <dt>Attended</dt>
            <dd>{s.attendees.length}</dd>
          </div>
          <div>
            <dt>No-shows</dt>
            <dd>{s.refundedAll ? 0 : s.noShows.length}</dd>
          </div>
          <div>
            <dt>Penalty pot</dt>
            <dd>{formatMoney(s.pot)}</dd>
          </div>
        </dl>
      </header>

      {s.refundedAll && (
        <div className="banner banner--info">Nobody checked in, so there was no one to pay — everyone was refunded in full.</div>
      )}
      {s.committed.length === 0 && <div className="banner banner--info">Nobody committed to this event, so no money moved.</div>}

      <div className="settlement__grid">
        <section className="card">
          <h3 className="card__title">Attendees</h3>
          {s.attendees.length === 0 && <p className="muted small">Nobody checked in.</p>}
          <ul className="result-rows">
            {s.attendees.map((id) => (
              <li key={id}>
                <Avatar user={user(id)} size={38} />
                <span className="result-rows__text">
                  <strong>{nameOf(id)}</strong>
                  <small>
                    {formatMoney(event.amount)} back
                    {penaltyShare(id) > 0 ? ` + ${formatMoney(penaltyShare(id))} from no-shows` : ''}
                  </small>
                </span>
                <strong className="amount amount--plus">{formatMoney(s.payouts[id], { sign: true })}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h3 className="card__title">No-shows</h3>
          {(s.noShows.length === 0 || s.refundedAll) && <p className="muted small">Everyone who committed showed up. 🎉</p>}
          {!s.refundedAll && (
            <ul className="result-rows">
              {s.noShows.map((id) => (
                <li key={id}>
                  <Avatar user={user(id)} size={38} />
                  <span className="result-rows__text">
                    <strong>{nameOf(id)}</strong>
                    <small>Didn’t check in before the grace period ended</small>
                  </span>
                  <strong className="amount amount--minus">{formatMoney(-event.amount, { sign: true })}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card settlement__transfers">
          <h3 className="card__title">Transfer breakdown</h3>
          <table className="table">
            <thead>
              <tr>
                <th>From</th>
                <th />
                <th>To</th>
                <th>Via Starling</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {s.transfers.map((t, i) => (
                <tr key={i}>
                  <td>{t.from === 'held' ? <span className="pill pill--soft">Held · {nameOf(t.to)}</span> : nameOf(t.from)}</td>
                  <td className="muted">
                    <ArrowRight size={14} />
                  </td>
                  <td>{nameOf(t.to)}</td>
                  <td>
                    <span className="muted small">{t.kind === 'refund' ? 'Space → Main' : 'Faster Payment'}</span>{' '}
                    {t.kind === 'penalty' && now < s.settledAt + PAYMENT_SETTLE_MS ? (
                      <span className="status-pill status-pill--pending">
                        <Clock size={11} /> Pending
                      </span>
                    ) : (
                      <span className="status-pill status-pill--done">
                        <CircleCheck size={11} /> Done
                      </span>
                    )}
                  </td>
                  <td className="num">
                    {formatMoney(t.amount)}
                    <small className="muted">{t.kind === 'refund' ? ' refund' : ' penalty'}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {s.transfers.some((t) => t.kind === 'penalty') && (
            <p className="muted small">
              Refunds come straight back from each person’s Show up! Space. Penalties are sent by Faster Payment and split equally; any leftover
              penny goes to one attendee so the totals match exactly. Reference {eventReference(event)}.
            </p>
          )}
        </section>

        <section className="card">
          <h3 className="card__title">Updated balances</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th className="num">Starling main</th>
                <th className="num">Show up! Space</th>
              </tr>
            </thead>
            <tbody>
              {s.committed.map((id) => (
                <tr key={id}>
                  <td>
                    <span className="table__person">
                      <Avatar user={user(id)} size={26} /> {nameOf(id)}
                    </span>
                  </td>
                  <td className="num">{formatMoney(user(id).balance)}</td>
                  <td className="num">{formatMoney(user(id).held)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {memory && (
          <section className="card settlement__memory">
            <h3 className="card__title">
              <Heart size={18} /> Save the memory
            </h3>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="How did it go? Score, highlights, who owes a rematch…" maxLength={280} />
            <div className="settlement__memory-actions">
              <button type="button" className="btn btn--primary" onClick={() => updateMemory(memory.id, note.trim())}>
                Save memory
              </button>
              <Link to="/memories" className="btn btn--ghost">
                See all memories
              </Link>
            </div>
          </section>
        )}
      </div>

      {nextInSeries && (
        <Link to={`/events/${nextInSeries.id}`} className="banner banner--wine">
          <Repeat size={20} />
          <span>
            <strong>Next {event.title}</strong> is scheduled for {formatDateTime(nextInSeries.startAt)}
          </span>
          <ArrowRight size={18} />
        </Link>
      )}
    </div>
  )
}
