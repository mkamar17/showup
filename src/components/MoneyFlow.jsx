// "How your money moves" — the four stages and the Starling call behind each.
import { CircleCheck, Clock, Lock, Send } from 'lucide-react'
import '../styles/starling.css'

const STEPS = [
  { icon: Lock, title: 'Commit', text: 'Approve in the Starling app. The amount moves from your main account into your Show up! Space.', api: 'PUT savings-goals/…/add-money' },
  { icon: Clock, title: 'Held', text: 'It stays in your Space until the event’s grace period ends.', api: 'webhook: transfer settled' },
  { icon: CircleCheck, title: 'Check in', text: 'Your location is checked against the venue radius. No money moves.', api: 'no bank call' },
  { icon: Send, title: 'Settle', text: null, api: 'withdraw-money · payments/local' },
]

export default function MoneyFlow() {
  return (
    <section className="card">
      <h3 className="card__title">How your money moves</h3>
      <div className="money-flow">
        {STEPS.map(({ icon: Icon, title, text, api }, i) => (
          <div key={title} className="money-flow__step">
            <span className="money-flow__icon">
              <Icon size={20} />
            </span>
            <strong>
              {i + 1}. {title}
            </strong>
            {text ? (
              <p>{text}</p>
            ) : (
              <p>
                <span className="ok">Showed up → back to your main account + your share</span>
                <br />
                <span className="bad">Missed it → paid to attendees</span>
              </p>
            )}
            <code>{api}</code>
          </div>
        ))}
      </div>
    </section>
  )
}
