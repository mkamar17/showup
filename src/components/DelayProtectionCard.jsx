// TfL delay protection: tell us your line, TfL's live status decides.
// Suspended → your commitment is released; delays → more time for you only.
// No organiser approval: the transport data is the proof.
import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock3, LoaderCircle, ShieldCheck, TrainFront, Wand2 } from 'lucide-react'
import { useApp } from '../api/useApp'
import { ME_ID } from '../api/constants'
import { canMemberCheckIn, memberDeadline } from '../api/eventLogic'
import { formatMoney, formatTime } from '../api/format'
import { DEMO_TFL_STATUSES, TFL_LINES } from '../api/tflApi'

const RULES = [
  ['Suspended', 'commitment released, not a no-show'],
  ['Severe delays', '+20 min to check in'],
  ['Minor delays', '+10 min to check in'],
]

export default function DelayProtectionCard({ event }) {
  const { now, checkTransportDelay, clearTransportDelay } = useApp()
  const [lineId, setLineId] = useState('victoria')
  const [demoLabel, setDemoLabel] = useState('Suspended')
  const me = event.members[ME_ID]
  const delay = me?.delay
  const tfl = delay?.tfl
  const amount = formatMoney(event.amount)

  if (me?.excused) {
    return (
      <section className="card delay-card delay-card--release">
        <div className="delay-card__status">
          <ShieldCheck size={22} />
          <div>
            <h2>Excused by TfL</h2>
            <p>
              TfL confirmed <strong>{me.excused.lineName}: {me.excused.label}</strong>. Your {amount} has been released back to your Starling
              account, and you won’t be counted as a no-show.
            </p>
            {me.excused.reason && <small className="delay-card__reason">{me.excused.reason}</small>}
          </div>
        </div>
      </section>
    )
  }

  if (delay?.status === 'checking') {
    return (
      <section className="card delay-card">
        <div className="delay-card__status">
          <LoaderCircle className="delay-card__spin" size={22} />
          <div>
            <h2>Checking with TfL…</h2>
            <p>Looking up live service status for your line.</p>
          </div>
        </div>
      </section>
    )
  }

  if (delay?.status === 'extend' && !me.checkedInAt) {
    return (
      <section className="card delay-card delay-card--extend">
        <div className="delay-card__status">
          <Clock3 size={22} />
          <div>
            <h2>+{delay.minutes} min to check in</h2>
            <p>
              TfL confirmed <strong>{tfl.lineName}: {tfl.label}</strong>. Your deadline is now <strong>{formatTime(memberDeadline(event, ME_ID))}</strong>
              , just for you.
            </p>
            {tfl.reason && <small className="delay-card__reason">{tfl.reason}</small>}
          </div>
        </div>
      </section>
    )
  }

  if (delay?.status === 'none' || delay?.status === 'error') {
    return (
      <section className="card delay-card delay-card--none">
        <div className="delay-card__status">
          <AlertTriangle size={22} />
          <div>
            <h2>{delay.status === 'error' ? 'Couldn’t reach TfL' : `TfL reports ${tfl.label}`}</h2>
            <p>
              {delay.status === 'error'
                ? delay.error || 'Try again in a moment.'
                : delay.why || `No disruption on the ${tfl.lineName}, so your normal deadline still applies.`}
            </p>
          </div>
        </div>
        {canMemberCheckIn(event, ME_ID, now) && (
          <button type="button" className="btn btn--soft btn--sm" onClick={() => clearTransportDelay(event.id)}>
            Check another line
          </button>
        )}
      </section>
    )
  }

  // Only someone still on their way can ask: committed, not checked in, window open.
  if (!canMemberCheckIn(event, ME_ID, now)) return null

  return (
    <section className="card delay-card">
      <div className="card__head">
        <h2>
          <TrainFront size={19} /> Stuck on the tube?
        </h2>
        <span className="pill pill--soft">TfL protection</span>
      </div>
      <p className="muted small">Pick your line. TfL’s live status decides automatically, with no approval needed:</p>
      <ul className="delay-card__rules">
        {RULES.map(([status, outcome]) => (
          <li key={status}>
            <strong>{status}</strong> → {outcome}
          </li>
        ))}
      </ul>

      <label className="delay-card__label" htmlFor={`tfl-line-${event.id}`}>
        Your line
      </label>
      <select id={`tfl-line-${event.id}`} className="select" value={lineId} onChange={(e) => setLineId(e.target.value)}>
        {TFL_LINES.map((line) => (
          <option key={line.id} value={line.id}>
            {line.label}
          </option>
        ))}
      </select>
      <button type="button" className="btn btn--primary btn--block delay-card__request" onClick={() => checkTransportDelay(event.id, lineId)}>
        <CheckCircle2 size={17} /> Check live TfL status
      </button>

      <div className="delay-card__demo">
        <span>
          <Wand2 size={14} /> Demo: pretend TfL says
        </span>
        <select className="select" value={demoLabel} onChange={(e) => setDemoLabel(e.target.value)} aria-label="Simulated TfL status">
          {DEMO_TFL_STATUSES.map((label) => (
            <option key={label}>{label}</option>
          ))}
        </select>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => checkTransportDelay(event.id, lineId, demoLabel)}>
          Run
        </button>
      </div>
    </section>
  )
}
