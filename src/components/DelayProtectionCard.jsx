import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock3, LoaderCircle, MessageSquareText, TrainFront, XCircle } from 'lucide-react'
import { useApp } from '../api/useApp'
import { TFL_LINES } from '../api/tflApi'
import { ME_ID } from '../api/constants'

export default function DelayProtectionCard({ event, phase, isAdmin }) {
  const { state, requestDelayProtection, requestOtherDelayProtection, clearDelayProtectionRequest, approveDelayProtection, declineDelayProtection } = useApp()
  const [lineId, setLineId] = useState('victoria')
  const [reasonType, setReasonType] = useState('tfl')
  const [otherNote, setOtherNote] = useState('')
  const request = event.lateRequest
  const requester = request ? state.users[request.memberId] : null
  const canRequest = ['checkin-open', 'grace'].includes(phase) && !request
  const isMyRequest = request?.memberId === ME_ID
  const isOtherReason = request?.reasonType === 'other'

  // Only verified disruptions become organiser approval requests. A Good
  // Service result remains visible to the requester as a retry prompt only.
  if (request?.status === 'pending' && isAdmin && !isMyRequest) {
    return (
      <section className="card delay-card delay-card--approval">
        <div className="card__head">
          <h2><TrainFront size={19} /> Delay-protection request</h2>
          <span className="pill pill--pink-soft">Admin decision</span>
        </div>
        <p className="muted small"><strong>{requester?.name || 'A member'}</strong> is running late and asked for more time.</p>
        <div className="delay-card__evidence">
          <strong>{isOtherReason ? 'Other reason' : request.tfl?.lineName || request.lineId}</strong>
          <span>{isOtherReason ? 'Organiser review required' : request.tfl?.label || 'Checking TfL status…'}</span>
          {isOtherReason && <small>{request.note || 'No note provided.'}</small>}
          {!isOtherReason && request.tfl?.reason && <small>{request.tfl.reason}</small>}
        </div>
        <div className="delay-card__actions">
          <button type="button" className="btn btn--primary" onClick={() => approveDelayProtection(event.id)}>
            <CheckCircle2 size={17} /> Approve +10 min
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => declineDelayProtection(event.id)}>
            <XCircle size={17} /> Decline
          </button>
        </div>
      </section>
    )
  }

  if (request) {
    const states = {
      checking: { icon: <LoaderCircle className="delay-card__spin" size={20} />, title: 'Checking TfL service status…', copy: 'We are looking for a disruption on the route you selected.' },
      pending: { icon: <Clock3 size={20} />, title: 'Waiting for organiser approval', copy: isOtherReason ? `Your organiser is reviewing your request. Your £${(event.amount / 100).toFixed(2)} remains held while they decide.` : `TfL reports ${request.tfl?.label} on the ${request.tfl?.lineName}. Your £${(event.amount / 100).toFixed(2)} remains held while they decide.` },
      approved: { icon: <CheckCircle2 size={20} />, title: 'Grace period extended by 10 minutes', copy: `Your organiser approved ${isOtherReason ? 'your extension request' : 'the verified TfL disruption'}. Check in before the new deadline to protect your commitment.` },
      declined: { icon: <XCircle size={20} />, title: 'Extension not approved', copy: 'Your original check-in deadline still applies.' },
      'not-verified': { icon: <AlertTriangle size={20} />, title: 'No TfL disruption found', copy: `TfL reports ${request.tfl?.label} on the ${request.tfl?.lineName}. Your original deadline still applies.` },
      error: { icon: <AlertTriangle size={20} />, title: 'TfL could not verify this request', copy: request.error || 'Try again shortly.' },
    }
    const status = states[request.status] || states.error
    return (
      <section className={`card delay-card delay-card--${request.status}`}>
        <div className="delay-card__status">
          {status.icon}
          <div><h2>{status.title}</h2><p>{status.copy}</p></div>
        </div>
        {(request.status === 'not-verified' || request.status === 'error') && (
          <button type="button" className="btn btn--soft btn--sm" onClick={() => clearDelayProtectionRequest(event.id)}>
            Try another reason
          </button>
        )}
      </section>
    )
  }

  if (!canRequest) return null

  return (
    <section className="card delay-card">
      <div className="card__head">
        <h2><TrainFront size={19} /> Running late?</h2>
        <span className="pill pill--soft">TfL delay protection</span>
      </div>
      <p className="muted small">TfL requests include live disruption evidence. Other reasons go directly to your organiser for review.</p>
      <div className="delay-card__reason-tabs" role="group" aria-label="Reason for being late">
        <button type="button" className={`btn btn--sm ${reasonType === 'tfl' ? 'btn--soft' : 'btn--ghost'}`} aria-pressed={reasonType === 'tfl'} onClick={() => setReasonType('tfl')}>
          <TrainFront size={15} /> TfL disruption
        </button>
        <button type="button" className={`btn btn--sm ${reasonType === 'other' ? 'btn--soft' : 'btn--ghost'}`} aria-pressed={reasonType === 'other'} onClick={() => setReasonType('other')}>
          <MessageSquareText size={15} /> Other reason
        </button>
      </div>
      {reasonType === 'tfl' ? (
        <>
          <label className="delay-card__label" htmlFor={`tfl-line-${event.id}`}>Affected service</label>
          <select id={`tfl-line-${event.id}`} className="select" value={lineId} onChange={(event) => setLineId(event.target.value)}>
            {TFL_LINES.map((line) => <option key={line.id} value={line.id}>{line.label}</option>)}
          </select>
          <button type="button" className="btn btn--soft btn--block delay-card__request" onClick={() => requestDelayProtection(event.id, lineId)}>
            <TrainFront size={17} /> Verify TfL delay & request +10 min
          </button>
        </>
      ) : (
        <>
          <label className="delay-card__label" htmlFor={`other-note-${event.id}`}>Optional note</label>
          <textarea id={`other-note-${event.id}`} value={otherNote} onChange={(event) => setOtherNote(event.target.value)} maxLength={180} rows={3} placeholder="Briefly explain why you are running late" />
          <button type="button" className="btn btn--soft btn--block delay-card__request" onClick={() => requestOtherDelayProtection(event.id, otherNote)}>
            <MessageSquareText size={17} /> Request +10 min
          </button>
        </>
      )}
    </section>
  )
}
