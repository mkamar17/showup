// "Join & commit" with Starling: review → approve in bank app → held.
import { useState } from 'react'
import { ArrowRight, BadgeCheck, CircleCheck, Landmark, Lock, Smartphone } from 'lucide-react'
import { useApp } from '../api/useApp'
import { formatDateTime, formatMoney } from '../api/format'
import { eventReference } from '../api/eventLogic'
import Modal from './Modal'
import BankApproval from './BankApproval'
import '../styles/starling.css'

export default function CommitModal({ event, onClose }) {
  const { me, commit, toast } = useApp()
  const [step, setStep] = useState('review') // review | approve | done
  const [before] = useState(() => ({ main: me.balance, space: me.held }))
  const [reference, setReference] = useState('')
  const sb = me.starling
  const enough = me.balance >= event.amount

  return (
    <Modal title={step === 'done' ? 'Commitment held' : `Commit ${formatMoney(event.amount)}`} onClose={onClose}>
      {step === 'review' && (
        <div className="commit-flow">
          <p className="muted small">
            {event.title} · {formatDateTime(event.startAt)}
          </p>
          <div className="money-src">
            <span className="money-src__icon">
              <Landmark size={16} />
            </span>
            <span>
              From Starling ••••{sb.accountLast4}
              <small>Balance {formatMoney(me.balance)}</small>
            </span>
          </div>
          <div className="money-src">
            <span className="money-src__icon money-src__icon--mustard">
              <Lock size={16} />
            </span>
            <span>
              Into your {sb.spaceName} Space
              <small>Held until settlement — still in your Starling account</small>
            </span>
          </div>
          <div className="commit-flow__outcomes">
            <div>
              <span>Show up</span>
              <strong className="amount--plus">{formatMoney(event.amount)} back + your share</strong>
            </div>
            <div>
              <span>Miss it</span>
              <strong className="amount--minus">{formatMoney(event.amount)} split between attendees</strong>
            </div>
          </div>
          {!enough && <p className="form-error">There isn’t enough in your Starling account for this commitment.</p>}
          <button type="button" className="btn btn--primary btn--block btn--lg" disabled={!enough} onClick={() => setStep('approve')}>
            <Smartphone size={18} /> Approve in Starling
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={onClose}>
            Cancel
          </button>
        </div>
      )}

      {step === 'approve' && (
        <BankApproval
          notification={{ title: 'Approve a transfer from Show up!', body: `${formatMoney(event.amount)} into your “${sb.spaceName}” Space` }}
          title="Show up! wants to move money"
          rows={[
            { label: 'Amount', value: formatMoney(event.amount) },
            { label: 'From', value: 'Main account' },
            { label: 'To', value: `${sb.spaceName} Space` },
            { label: 'Reference', value: eventReference(event) },
          ]}
          onApprove={() => {
            const ref = commit(event.id)
            if (!ref) return onClose()
            setReference(ref)
            setStep('done')
          }}
          onDecline={() => {
            toast('Transfer declined in Starling — nothing was moved')
            onClose()
          }}
        />
      )}

      {step === 'done' && (
        <div className="commit-flow commit-flow--center">
          <div className="connect-step__icon connect-step__icon--ok">
            <CircleCheck size={34} />
          </div>
          <h3>{formatMoney(event.amount)} is held</h3>
          <p className="muted small">It’s in your {sb.spaceName} Space on Starling. Check in at the venue to get it back.</p>
          <span className="connected-pill connected-pill--lg">
            <BadgeCheck size={14} /> Confirmed by Starling
          </span>
          <div className="before-after">
            <div className="before-after__box">
              <small>Main account</small>
              <strong>{formatMoney(before.main - event.amount)}</strong>
              <small>was {formatMoney(before.main)}</small>
            </div>
            <ArrowRight size={18} className="muted" />
            <div className="before-after__box before-after__box--mustard">
              <small>Show up! Space</small>
              <strong>{formatMoney(before.space + event.amount)}</strong>
              <small>was {formatMoney(before.space)}</small>
            </div>
          </div>
          <div className="commit-flow__ref">
            <span>Starling reference</span>
            <code>{reference}</code>
          </div>
          <button type="button" className="btn btn--primary btn--block btn--lg" onClick={onClose}>
            Back to event
          </button>
        </div>
      )}
    </Modal>
  )
}
