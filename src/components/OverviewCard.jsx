import { useState } from 'react'
import { useApp } from '../api/useApp'
import { MONTHLY_ATTENDANCE, WEEKLY_ATTENDANCE, ME_ID } from '../api/constants'
import { formatMoney } from '../api/format'
import AttendanceChart from './AttendanceChart'

export default function OverviewCard() {
  const { me, state } = useApp()
  const [range, setRange] = useState('monthly')

  const myEvents = state.events.filter((e) => e.settled && e.settlement.committed.includes(ME_ID))
  const attended = myEvents.filter((e) => e.settlement.attendees.includes(ME_ID)).length
  const showRate = myEvents.length ? Math.round((attended / myEvents.length) * 100) : 100

  return (
    <section className="card overview">
      <div className="overview__head">
        <h2>Overview</h2>
        <select value={range} onChange={(e) => setRange(e.target.value)} aria-label="Chart range">
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>
      <AttendanceChart key={range} data={range === 'monthly' ? MONTHLY_ATTENDANCE : WEEKLY_ATTENDANCE} />
      <div className="overview__stats">
        <div>
          <span>Available</span>
          <strong>{formatMoney(me.balance)}</strong>
          <small>Engine wallet</small>
        </div>
        <div className="is-featured">
          <span>Held</span>
          <strong>{formatMoney(me.held)}</strong>
          <small>Committed to events</small>
        </div>
        <div>
          <span>Show-up rate</span>
          <strong>{showRate}%</strong>
          <small>
            {attended}/{myEvents.length} events
          </small>
        </div>
      </div>
    </section>
  )
}
