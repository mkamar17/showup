// Starling activity that Engine initiated, with route, status and reference.
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CircleCheck, Clock } from 'lucide-react'
import { useApp } from '../api/useApp'
import { formatMoney, relativeTime } from '../api/format'
import '../styles/starling.css'

function Route({ route }) {
  if (!route) return null
  const [from, to] = route.split(' → ')
  return (
    <span className="tx-route">
      {from} <ArrowRight size={12} /> {to}
    </span>
  )
}

export default function StarlingActivity({ limit }) {
  const { state, now } = useApp()
  const list = limit ? state.transactions.slice(0, limit) : state.transactions

  return (
    <section className="card">
      <h3 className="card__title">Starling activity</h3>
      {list.length === 0 && <p className="muted small">Nothing yet — your commitments and payouts will appear here.</p>}
      <ul className="activity">
        {list.map((t) => {
          const pending = t.status === 'pending'
          const incoming = t.amount >= 0
          const Icon = pending ? Clock : incoming ? ArrowDownLeft : ArrowUpRight
          return (
            <li key={t.id}>
              <span className={`activity__icon ${pending ? 'is-wait' : incoming ? 'is-in' : 'is-out'}`}>
                <Icon size={16} />
              </span>
              <span className="activity__desc">
                <strong>{t.label}</strong>
                <small>
                  {t.sub ? `${t.sub} · ` : ''}
                  {relativeTime(t.time, now)}
                </small>
              </span>
              <span className="activity__route">
                <Route route={t.route} />
              </span>
              <span className="activity__status">
                {pending ? (
                  <span className="status-pill status-pill--pending">
                    <Clock size={12} /> Pending
                  </span>
                ) : (
                  <span className="status-pill status-pill--done">
                    <CircleCheck size={12} /> Completed
                  </span>
                )}
              </span>
              <span className="activity__ref">{t.reference}</span>
              <strong className={`activity__amount amount ${incoming ? 'amount--plus' : 'amount--minus'}`}>{formatMoney(t.amount, { sign: true })}</strong>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
