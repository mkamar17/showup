import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, Landmark, Lock, LogOut, RotateCcw, Send, ShieldCheck, Undo2, Unlink } from 'lucide-react'
import { useApp } from '../api/useApp'
import { ME_ID } from '../api/constants'
import { formatDateTime, formatMoney, relativeTime } from '../api/format'
import { isClosed, moneyRecord } from '../api/eventLogic'
import Avatar from '../components/Avatar'
import ConfirmModal from '../components/ConfirmModal'
import StarlingBar from '../components/StarlingBar'
import MoneyFlow from '../components/MoneyFlow'
import StarlingActivity from '../components/StarlingActivity'
import { PermissionList } from '../components/StarlingConnectModal'
import '../styles/profile.css'

const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'banking', label: 'Banking' },
  { id: 'wallet', label: 'Wallet' },
]

function DetailsTab() {
  const { me, updateProfile } = useApp()
  const [form, setForm] = useState({ name: me.name, email: me.email ?? '', bio: me.bio ?? '' })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const dirty = form.name !== me.name || form.email !== (me.email ?? '') || form.bio !== (me.bio ?? '')

  return (
    <form
      className="card form-grid"
      onSubmit={(e) => {
        e.preventDefault()
        if (form.name.trim()) updateProfile({ name: form.name.trim(), email: form.email.trim(), bio: form.bio.trim() })
      }}
    >
      <label className="field">
        <span>Full name</span>
        <input type="text" value={form.name} onChange={set('name')} required />
      </label>
      <label className="field">
        <span>Username</span>
        <input type="text" value={`@${me.username}`} disabled />
      </label>
      <label className="field field--full">
        <span>Email</span>
        <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
      </label>
      <label className="field field--full">
        <span>Bio</span>
        <textarea rows={3} value={form.bio} onChange={set('bio')} maxLength={160} placeholder="Tennis on Fridays, runs on Sundays…" />
      </label>
      <div className="field--full form-actions">
        <button type="submit" className="btn btn--primary" disabled={!dirty || !form.name.trim()}>
          Save details
        </button>
      </div>
    </form>
  )
}

function BankingTab() {
  const { me, now, disconnectStarling } = useApp()
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const sb = me.starling

  return (
    <div className="banking">
      <StarlingBar />
      {sb ? (
        <section className="card">
          <h3 className="card__title">Connection details</h3>
          <dl className="details-list">
            <div>
              <dt>Bank</dt>
              <dd>Starling Bank</dd>
            </div>
            <div>
              <dt>Account holder</dt>
              <dd>{sb.accountName}</dd>
            </div>
            <div>
              <dt>Account</dt>
              <dd>
                ••••{sb.accountLast4} · ••-••-{sb.sortLast2}
              </dd>
            </div>
            <div>
              <dt>Commitments Space</dt>
              <dd>{sb.spaceName}</dd>
            </div>
            <div>
              <dt>Connected</dt>
              <dd>{relativeTime(sb.connectedAt, now)}</dd>
            </div>
            <div>
              <dt>Access renews</dt>
              <dd>Every 90 days</dd>
            </div>
          </dl>
          <h3 className="card__title" style={{ marginTop: 22 }}>
            Show up! can
          </h3>
          <PermissionList />
          <div className="form-actions" style={{ marginTop: 18 }}>
            <button type="button" className="btn btn--danger-soft" onClick={() => setConfirmDisconnect(true)}>
              <Unlink size={16} /> Disconnect Starling
            </button>
          </div>
        </section>
      ) : (
        <section className="card">
          <h3 className="card__title">Why connect a bank?</h3>
          <p className="muted small" style={{ marginBottom: 16 }}>
            When you commit to an event, the money moves into a Space inside your own Starling account and stays there until the event is
            settled. Show up! asks for these permissions:
          </p>
          <PermissionList />
        </section>
      )}
      <div className="notice">
        <ShieldCheck size={18} />
        <span>Prototype: no real bank connection is made. The sign-in and approval screens are simulated.</span>
      </div>
      {confirmDisconnect && (
        <ConfirmModal
          title="Disconnect Starling?"
          message="You won’t be able to commit to events until you reconnect. Money still held in your Show up! Space must settle first."
          confirmLabel="Disconnect"
          danger
          onConfirm={disconnectStarling}
          onClose={() => setConfirmDisconnect(false)}
        />
      )}
    </div>
  )
}

function WalletTab() {
  const { me, state, toast, demoAddFunds, disconnectStarling } = useApp()
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const sb = me.starling
  const record = moneyRecord(state.events, ME_ID)
  const heldEvents = state.events
    .filter((e) => !isClosed(e) && e.members[ME_ID]?.status === 'committed')
    .sort((a, b) => a.startAt - b.startAt)

  return (
    <div className="wallet">
      <StarlingBar />

      {/* Your show up! money: what's at stake now, then your track record */}
      <div className="spaces-row">
        <div className="space-card space-card--mustard">
          <span className="space-card__label">
            <Lock size={18} /> Held now
          </span>
          <strong className="space-card__amount">{formatMoney(me.held)}</strong>
          <small>In your Show up! Space inside Starling · held until settlement</small>
          <div className="space-breakdown">
            {heldEvents.length === 0 && <p>Nothing held right now</p>}
            {heldEvents.map((e) => (
              <Link key={e.id} to={`/events/${e.id}`}>
                <span>
                  {e.title}
                  <small>{formatDateTime(e.startAt)}</small>
                </span>
                <strong>{formatMoney(e.amount)}</strong>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-card space-card--white">
          <span className="space-card__label">
            <Undo2 size={18} /> Returned
          </span>
          <strong className="space-card__amount">{formatMoney(record.returned)}</strong>
          <small className="muted">
            Showed up {record.showedUp} time{record.showedUp === 1 ? '' : 's'} · commitments back in your main account
          </small>
        </div>

        <div className="space-card space-card--wine">
          <span className="space-card__label">
            <ArrowDownLeft size={18} /> Earned
          </span>
          <strong className="space-card__amount">{formatMoney(record.earned)}</strong>
          <small>Your share from friends who didn’t show</small>
          <span className="space-card__tag">
            <Send size={12} /> Faster Payments
          </span>
        </div>

        <div className="space-card space-card--white">
          <span className="space-card__label">
            <ArrowUpRight size={18} /> Lost
          </span>
          <strong className="space-card__amount">{formatMoney(record.lost)}</strong>
          <small className="muted">
            {record.missed === 0 ? 'Never missed an event — nice' : `Missed ${record.missed} event${record.missed === 1 ? '' : 's'} · paid to those who came`}
          </small>
        </div>
      </div>

      <MoneyFlow />
      <StarlingActivity />

      <section className="card bank-actions">
        <span className="bank-actions__note">
          <ShieldCheck size={16} /> Show up! can only move money into and out of your Show up! Space, and pay attendees after an event you
          committed to.
        </span>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => demoAddFunds(2000)} disabled={!sb} title="Demo only">
          Demo: receive £20
        </button>
        {sb && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmDisconnect(true)}>
            Disconnect Starling
          </button>
        )}
        <button type="button" className="btn btn--primary btn--sm" onClick={() => toast('This would open the Starling app on your phone')} disabled={!sb}>
          View in Starling app
        </button>
      </section>
      <p className="muted small center">Prototype — not connected to Starling. Balances and payments are simulated.</p>

      {confirmDisconnect && (
        <ConfirmModal
          title="Disconnect Starling?"
          message="You won’t be able to commit to events until you reconnect. Money still held in your Show up! Space must settle first."
          confirmLabel="Disconnect"
          danger
          onConfirm={disconnectStarling}
          onClose={() => setConfirmDisconnect(false)}
        />
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { me, logout, resetDemo } = useApp()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [confirmReset, setConfirmReset] = useState(false)
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'details'

  return (
    <div className="profile">
      <section className="profile__header card">
        <Avatar user={me} size={72} />
        <div>
          <h2>{me.name}</h2>
          <p className="muted">@{me.username}</p>
        </div>
        <div className="profile__header-actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={15} /> Reset demo
          </button>
          <button
            type="button"
            className="btn btn--soft btn--sm"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            <LogOut size={15} /> Log out
          </button>
        </div>
      </section>

      <div className="segmented tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'is-active' : ''} onClick={() => setParams({ tab: t.id })}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'details' && <DetailsTab key={me.name} />}
      {tab === 'banking' && <BankingTab />}
      {tab === 'wallet' && <WalletTab />}

      {confirmReset && (
        <ConfirmModal
          title="Reset demo data?"
          message="Events, friends, balances and memories go back to the starting demo. You stay logged in."
          confirmLabel="Reset"
          danger
          onConfirm={resetDemo}
          onClose={() => setConfirmReset(false)}
        />
      )}
    </div>
  )
}
