// Admin-only controls to fast-forward the event during a demo.
import { useState } from 'react'
import { FastForward, Flag, TrainFront, Zap } from 'lucide-react'
import { useApp } from '../api/useApp'
import { DEMO_GRACE_SPEED } from '../api/constants'
import ConfirmModal from './ConfirmModal'

export default function DemoControls({ event, phase }) {
  const { startEventNow, endGracePeriod, createDemoDelayRequest } = useApp()
  const [confirmEnd, setConfirmEnd] = useState(false)
  const started = phase === 'grace' || phase === 'settling'
  const fastSeconds = Math.round((event.graceMinutes * 60) / DEMO_GRACE_SPEED)

  return (
    <section className="card demo-controls">
      <div className="card__head">
        <h2>
          <Zap size={18} /> Demo controls
        </h2>
        <span className="pill pill--soft">Admin only</span>
      </div>
      <p className="muted small">Fast-forward the timeline so you can show the full flow in one sitting.</p>
      <div className="demo-controls__buttons">
        <button type="button" className="btn btn--soft" onClick={() => startEventNow(event.id)} disabled={started}>
          <FastForward size={16} /> Start event now
          <small>{fastSeconds}s grace</small>
        </button>
        <button type="button" className="btn btn--danger-soft" onClick={() => setConfirmEnd(true)}>
          <Flag size={16} /> End grace period
          <small>Settle now</small>
        </button>
        <button type="button" className="btn btn--soft" onClick={() => createDemoDelayRequest(event.id)} disabled={Boolean(event.lateRequest)}>
          <TrainFront size={16} /> Demo TfL delay
          <small>Victoria line</small>
        </button>
      </div>
      {confirmEnd && (
        <ConfirmModal
          title="End grace period now?"
          message="Anyone who hasn’t checked in will lose their commitment, and it’ll be split between the attendees. This can’t be undone."
          confirmLabel="End & settle"
          danger
          onConfirm={() => endGracePeriod(event.id)}
          onClose={() => setConfirmEnd(false)}
        />
      )}
    </section>
  )
}
