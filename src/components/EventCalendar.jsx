import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Repeat } from 'lucide-react'
import { isClosed, occursOn } from '../api/eventLogic'
import { formatTime, toDateInput } from '../api/format'
import ActivityIcon from './ActivityIcon'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function buildMonth(year, month) {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7 // Monday first
  const days = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < offset; i += 1) cells.push(null)
  for (let d = 1; d <= days; d += 1) cells.push(toDateInput(new Date(year, month, d)))
  while (cells.length % 7) cells.push(null)
  return cells
}

export default function EventCalendar({ events }) {
  const navigate = useNavigate()
  const today = toDateInput(new Date())
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [selected, setSelected] = useState(today)
  const cells = buildMonth(cursor.year, cursor.month)

  const eventsOn = (dateStr) =>
    events
      .map((e) => ({ event: e, kind: occursOn(e, dateStr) }))
      .filter((x) => x.kind)
      .sort((a, b) => a.event.time.localeCompare(b.event.time))

  const move = (delta) =>
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

  const selectedEvents = selected ? eventsOn(selected) : []
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div className="calendar">
      <div className="calendar__head">
        <button type="button" className="icon-btn icon-btn--soft" onClick={() => move(-1)} aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <h3>{monthLabel}</h3>
        <button type="button" className="icon-btn icon-btn--soft" onClick={() => move(1)} aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="calendar__grid">
        {WEEKDAYS.map((d) => (
          <span key={d} className="calendar__weekday">
            {d}
          </span>
        ))}
        {cells.map((dateStr, i) => {
          if (!dateStr) return <span key={`blank-${i}`} className="calendar__cell is-blank" />
          const dayEvents = eventsOn(dateStr)
          const classes = [
            'calendar__cell',
            dateStr === today && 'is-today',
            dateStr === selected && 'is-selected',
            dayEvents.length && 'has-events',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button key={dateStr} type="button" className={classes} onClick={() => setSelected(dateStr)}>
              <span>{Number(dateStr.slice(-2))}</span>
              <span className="calendar__dots">
                {dayEvents.slice(0, 3).map(({ event, kind }) => (
                  <i key={event.id} className={`${kind === 'repeat' ? 'is-repeat' : ''} ${isClosed(event) ? 'is-past' : ''}`} />
                ))}
              </span>
            </button>
          )
        })}
      </div>
      <div className="calendar__day">
        <h4>{new Date(`${selected}T12:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
        {selectedEvents.length === 0 && <p className="muted small">Nothing planned this day.</p>}
        {selectedEvents.map(({ event, kind }) => (
          <button key={event.id} type="button" className="calendar__event" onClick={() => navigate(`/events/${event.id}`)}>
            <span className="calendar__event-icon">
              <ActivityIcon activity={event.activity} size={16} />
            </span>
            <span>
              <strong>{event.title}</strong>
              <small>
                {kind === 'repeat' ? event.time : formatTime(event.startAt)} · {event.venue.name}
              </small>
            </span>
            {kind === 'repeat' && (
              <span className="pill pill--soft">
                <Repeat size={11} /> Repeats
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
