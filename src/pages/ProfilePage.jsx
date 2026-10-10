import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, Landmark, LogOut, RotateCcw, ShieldCheck, Wallet } from 'lucide-react'
import { useApp } from '../api/useApp'
import { formatMoney, relativeTime } from '../api/format'
import Avatar from '../components/Avatar'
import ConfirmModal from '../components/ConfirmModal'
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
  const { me, updateBank } = useApp()
  const [editing, setEditing] = useState(!me.bank)
  const [form, setForm] = useState({ holder: me.bank?.holder ?? me.name, sortCode: '', accountNumber: '' })
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function save(e) {
    e.preventDefault()
    const sort = form.sortCode.replace(/\D/g, '')
    const acc = form.accountNumber.replace(/\D/g, '')
    if (!form.holder.trim()) return setError('Enter the account holder name')
    if (sort.length !== 6) return setError('Sort codes have 6 digits (e.g. 12-34-56)')
    if (acc.length !== 8) return setError('Account numbers have 8 digits')
    // Only the last four digits are kept, even in this mock.
    updateBank({ holder: form.holder.trim(), sortCode: `••-••-${sort.slice(4)}`, accountNumber: `••••${acc.slice(4)}` })
    setError('')
    setEditing(false)
  }

  return (
    <div className="card">
      <div className="notice">
        <ShieldCheck size={18} />
        <span>Prototype only — no real bank connection. Don’t enter real details; only the last digits are stored, in this browser.</span>
      </div>
      {!editing && me.bank ? (
        <div className="bank-card">
          <Landmark size={28} />
          <div>
            <strong>{me.bank.holder}</strong>
            <span>
              Sort code {me.bank.sortCode} · Account {me.bank.accountNumber}
            </span>
          </div>
          <div className="bank-card__actions">
            <button type="button" className="btn btn--soft btn--sm" onClick={() => setEditing(true)}>
              Change
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => updateBank(null)}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <form className="form-grid" onSubmit={save}>
          <label className="field field--full">
            <span>Account holder</span>
            <input type="text" value={form.holder} onChange={set('holder')} />
          </label>
          <label className="field">
            <span>Sort code</span>
            <input type="text" inputMode="numeric" value={form.sortCode} onChange={set('sortCode')} placeholder="12-34-56" maxLength={8} />
          </label>
          <label className="field">
            <span>Account number</span>
            <input type="text" inputMode="numeric" value={form.accountNumber} onChange={set('accountNumber')} placeholder="12345678" maxLength={8} />
          </label>
          {error && <p className="form-error field--full">{error}</p>}
          <div className="field--full form-actions">
            {me.bank && (
              <button type="button" className="btn btn--ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn--primary">
              Save banking details
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

const TX_ICONS = { topup: ArrowDownLeft, refund: ArrowDownLeft, payout: ArrowDownLeft, hold: ArrowUpRight, forfeit: ArrowUpRight, withdraw: ArrowUpRight }

function WalletTab() {
  const { me, state, now, topUp, withdraw } = useApp()
  const won = state.transactions.filter((t) => t.type === 'payout').reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="wallet">
      <div className="spaces">
        <div className="space space--purple">
          <Wallet size={22} />
          <span>Available</span>
          <strong>{formatMoney(me.balance)}</strong>
          <small>Free to commit or withdraw</small>
        </div>
        <div className="space space--pink">
          <ShieldCheck size={22} />
          <span>Held</span>
          <strong>{formatMoney(me.held)}</strong>
          <small>Locked until settlement</small>
        </div>
        <div className="space space--white">
          <ArrowDownLeft size={22} />
          <span>Won from no-shows</span>
          <strong>{formatMoney(won)}</strong>
          <small>All time</small>
        </div>
      </div>

      <div className="card wallet__actions">
        <span className="muted small">Mock money movement</span>
        <button type="button" className="btn btn--soft" onClick={() => topUp(1000)}>
          Top up £10
        </button>
        <button type="button" className="btn btn--soft" onClick={() => topUp(2000)}>
          Top up £20
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => withdraw(me.balance)}>
          Withdraw all
        </button>
      </div>

      <section className="card">
        <h3 className="card__title">History</h3>
        {state.transactions.length === 0 && <p className="muted small">No transactions yet.</p>}
        <ul className="tx-rows">
          {state.transactions.map((t) => {
            const Icon = TX_ICONS[t.type] ?? ArrowUpRight
            return (
              <li key={t.id}>
                <span className={`tx-rows__icon ${t.amount >= 0 ? 'is-in' : 'is-out'}`}>
                  <Icon size={16} />
                </span>
                <span className="tx-rows__text">
                  <strong>{t.label}</strong>
                  <small>
                    {relativeTime(t.time, now)}
                    {t.space === 'held' ? ' · from Held' : ''}
                  </small>
                </span>
                <strong className={`amount ${t.amount >= 0 ? 'amount--plus' : 'amount--minus'}`}>{formatMoney(t.amount, { sign: true })}</strong>
              </li>
            )
          })}
        </ul>
      </section>
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
