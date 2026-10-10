// Bank connection status: connected bar, or a prompt to connect.
import { useState } from 'react'
import { BadgeCheck, Landmark, RefreshCw } from 'lucide-react'
import { useApp } from '../api/useApp'
import { relativeTime } from '../api/format'
import Modal from './Modal'
import StarlingConnectModal, { PermissionList } from './StarlingConnectModal'
import '../styles/starling.css'

export default function StarlingBar({ compact = false }) {
  const { me, now, syncStarling } = useApp()
  const [connecting, setConnecting] = useState(false)
  const [showPerms, setShowPerms] = useState(false)
  const sb = me.starling

  if (!sb) {
    return (
      <section className="bank-bar bank-bar--prompt">
        <span className="bank-bar__logo">
          <Landmark size={24} />
        </span>
        <div className="bank-bar__text">
          <strong>Connect Starling to start committing</strong>
          <span>Commitments are held in a Space inside your own Starling account.</span>
        </div>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => setConnecting(true)}>
          Connect Starling
        </button>
        {connecting && <StarlingConnectModal onClose={() => setConnecting(false)} />}
      </section>
    )
  }

  return (
    <section className="bank-bar">
      <span className="bank-bar__logo">
        <Landmark size={24} />
      </span>
      <div className="bank-bar__text">
        <strong>
          Starling Bank
          <span className="connected-pill">
            <BadgeCheck size={13} /> Connected
          </span>
        </strong>
        <span>
          {compact ? `Account ••••${sb.accountLast4}` : `Personal account ••••${sb.accountLast4} · sort code ••-••-${sb.sortLast2} · connected securely via Starling (OAuth)`}
        </span>
      </div>
      <button type="button" className="bank-bar__sync" onClick={syncStarling} title="Refresh from Starling">
        <RefreshCw size={14} /> Synced {relativeTime(sb.lastSyncedAt, now)}
      </button>
      {!compact && (
        <button type="button" className="btn btn--soft btn--sm" onClick={() => setShowPerms(true)}>
          Manage permissions
        </button>
      )}
      {showPerms && (
        <Modal title="What Engine can do" onClose={() => setShowPerms(false)}>
          <PermissionList />
          <p className="muted small" style={{ marginTop: 14 }}>
            You can also revoke Engine’s access at any time from the Starling app. Connected {relativeTime(sb.connectedAt, now)}.
          </p>
        </Modal>
      )}
    </section>
  )
}
