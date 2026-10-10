// Mock OAuth "Connect Starling" flow: permissions → redirect → approve → done.
import { useEffect, useState } from 'react'
import { CircleCheck, Landmark, Link2, Lock } from 'lucide-react'
import { useApp } from '../api/useApp'
import { STARLING_PERMISSIONS } from '../api/constants'
import Modal from './Modal'
import BankApproval from './BankApproval'
import '../styles/starling.css'

export function PermissionList() {
  return (
    <ul className="perm-list">
      {STARLING_PERMISSIONS.map((p) => (
        <li key={p.title} className="perm-list__ok">
          <CircleCheck size={17} />
          <span>
            {p.title}
            <small>{p.detail}</small>
          </span>
        </li>
      ))}
      <li className="perm-list__no">
        <Lock size={17} />
        <span>Engine never sees your login, card details or other Spaces</span>
      </li>
    </ul>
  )
}

export default function StarlingConnectModal({ onClose, onConnected }) {
  const { me, connectStarling, toast } = useApp()
  const [step, setStep] = useState('permissions') // permissions | redirect | consent | done

  useEffect(() => {
    if (step !== 'redirect') return undefined
    const t = setTimeout(() => setStep('consent'), 1300)
    return () => clearTimeout(t)
  }, [step])

  return (
    <Modal title="Connect Starling" onClose={onClose}>
      {step === 'permissions' && (
        <div className="connect-step">
          <div className="connect-step__icon">
            <Link2 size={30} />
          </div>
          <h3 className="center">Connect your Starling account</h3>
          <p className="muted small center">Engine will ask Starling for permission to:</p>
          <PermissionList />
          <button type="button" className="btn btn--primary btn--block btn--lg" onClick={() => setStep('redirect')}>
            <Landmark size={18} /> Continue to Starling
          </button>
          <p className="muted small center">You’ll sign in and approve on Starling — Engine never sees your password.</p>
        </div>
      )}

      {step === 'redirect' && (
        <div className="connect-step connect-step--center">
          <span className="spinner" />
          <h3>Opening Starling…</h3>
          <p className="muted small">Secure sign-in (OAuth 2.0)</p>
        </div>
      )}

      {step === 'consent' && (
        <BankApproval
          notification={{ title: 'Engine wants to connect', body: 'Review what Engine can access' }}
          title="Allow Engine to access your account?"
          rows={[
            { label: 'Account', value: `${me.name} · ••••5678` },
            { label: 'Access', value: 'Balance, 1 Space, payments' },
            { label: 'Valid for', value: '90 days (renewable)' },
          ]}
          approveLabel="Allow access"
          onApprove={() => {
            connectStarling()
            setStep('done')
          }}
          onDecline={() => {
            toast('Connection cancelled in Starling')
            onClose()
          }}
        />
      )}

      {step === 'done' && (
        <div className="connect-step connect-step--center">
          <div className="connect-step__icon connect-step__icon--ok">
            <CircleCheck size={34} />
          </div>
          <h3>Starling connected</h3>
          <p className="muted small">
            We created a Space called <strong>Engine Commitments</strong> in your Starling account. Money you commit to events is held there.
          </p>
          <button
            type="button"
            className="btn btn--primary btn--block btn--lg"
            onClick={() => {
              onConnected?.()
              onClose()
            }}
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  )
}
