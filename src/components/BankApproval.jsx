// Generic "your banking app" approval screen. Stands in for the Starling app
// (strong customer authentication) — deliberately not a copy of Starling's UI.
import { KeyRound, Landmark } from 'lucide-react'
import '../styles/starling.css'

export default function BankApproval({ notification, title, rows, approveLabel = 'Approve with Face ID', onApprove, onDecline }) {
  return (
    <div className="bank-app">
      <div className="bank-app__notif">
        <span className="bank-app__logo">
          <Landmark size={15} />
        </span>
        <span>
          <strong>{notification.title}</strong>
          <small>{notification.body}</small>
        </span>
      </div>
      <div className="bank-app__key">
        <KeyRound size={30} />
      </div>
      <h3>{title}</h3>
      <div className="bank-app__card">
        {rows.map((r) => (
          <div key={r.label} className="bank-app__row">
            <span>{r.label}</span>
            <strong>{r.value}</strong>
          </div>
        ))}
      </div>
      <button type="button" className="bank-app__btn bank-app__btn--approve" onClick={onApprove}>
        {approveLabel}
      </button>
      <button type="button" className="bank-app__btn bank-app__btn--decline" onClick={onDecline}>
        Decline
      </button>
      <p className="bank-app__note">Prototype: this stands in for the approval screen in your Starling app.</p>
    </div>
  )
}
