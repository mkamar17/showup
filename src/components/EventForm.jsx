// Create / edit event modal.
import { useState } from 'react'
import { Lock, Repeat } from 'lucide-react'
import { useApp } from '../api/useApp'
import { ACTIVITIES, GRACE_OPTIONS, ME_ID, RADIUS_MAX, RADIUS_MIN } from '../api/constants'
import { toDateInput } from '../api/format'
import Modal from './Modal'
import VenuePicker from './VenuePicker'
import Avatar from './Avatar'

function initialForm(event) {
  if (event) {
    return {
      title: event.title,
      activity: event.activity,
      date: event.date,
      time: event.time,
      venue: event.venue,
      radius: event.radius,
      amount: (event.amount / 100).toString(),
      graceMinutes: event.graceMinutes,
      repeatWeekly: event.repeatWeekly,
      invitees: Object.keys(event.members).filter((id) => id !== ME_ID),
    }
  }
  // Default: next Friday 18:00, like the "Friday Tennis" scenario.
  const d = new Date()
  d.setDate(d.getDate() + (((5 - d.getDay() + 7) % 7) || 7))
  return {
    title: '',
    activity: 'tennis',
    date: toDateInput(d),
    time: '18:00',
    venue: null,
    radius: 150,
    amount: '5',
    graceMinutes: 10,
    repeatWeekly: false,
    invitees: [],
  }
}

export default function EventForm({ event, onClose, onSaved }) {
  const { state, createEvent, updateEvent } = useApp()
  const [form, setForm] = useState(() => initialForm(event))
  const [errors, setErrors] = useState({})
  const isEdit = Boolean(event)
  const hasCommitments = isEdit && Object.values(event.members).some((m) => m.status === 'committed')
  const friends = state.friends.map((id) => state.users[id])
  // Keep members who were invited but are no longer friends visible when editing.
  const extraMembers = isEdit
    ? Object.keys(event.members).filter((id) => id !== ME_ID && !state.friends.includes(id)).map((id) => state.users[id])
    : []

  const set = (key) => (e) => {
    const value = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e
    setForm((f) => ({ ...f, [key]: value }))
  }

  const toggleInvitee = (id) => {
    const member = event?.members[id]
    if (member?.status === 'committed') return // can't un-invite someone holding money here
    setForm((f) => ({
      ...f,
      invitees: f.invitees.includes(id) ? f.invitees.filter((x) => x !== id) : [...f.invitees, id],
    }))
  }

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = 'Give your event a name'
    if (!form.date || !form.time) e.date = 'Pick a date and time'
    else if (!isEdit && new Date(`${form.date}T${form.time}`).getTime() < Date.now()) e.date = 'Pick a time in the future'
    if (!form.venue) e.venue = 'Choose a venue so check-in knows where to look'
    const amount = Number(form.amount)
    if (!(amount >= 1 && amount <= 100)) e.amount = 'Between £1 and £100'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function submit(e) {
    e.preventDefault()
    if (!validate()) return
    if (isEdit) {
      updateEvent(event.id, form)
      onSaved?.(event.id)
    } else {
      const id = createEvent(form)
      onSaved?.(id)
    }
    onClose()
  }

  return (
    <Modal
      title={isEdit ? 'Edit event' : 'Create event'}
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="event-form" className="btn btn--primary">
            {isEdit ? 'Save changes' : 'Create event'}
          </button>
        </>
      }
    >
      <form id="event-form" className="form-grid" onSubmit={submit} noValidate>
        <label className="field field--full">
          <span>Event name</span>
          <input type="text" placeholder="e.g. Friday Tennis" value={form.title} onChange={set('title')} maxLength={40} autoFocus />
          {errors.title && <small className="form-error">{errors.title}</small>}
        </label>

        <label className="field">
          <span>Activity</span>
          <select value={form.activity} onChange={set('activity')}>
            {ACTIVITIES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <div className="field">
          <span>Date & time</span>
          <div className="field__row">
            <input type="date" value={form.date} onChange={set('date')} aria-label="Date" />
            <input type="time" value={form.time} onChange={set('time')} aria-label="Time" />
          </div>
          {errors.date && <small className="form-error">{errors.date}</small>}
        </div>

        <div className="field field--full">
          <span>Venue</span>
          <VenuePicker value={form.venue} radius={Number(form.radius)} onChange={set('venue')} />
          {errors.venue && <small className="form-error">{errors.venue}</small>}
        </div>

        <label className="field">
          <span>
            Check-in radius <strong className="accent">{form.radius}m</strong>
          </span>
          <input type="range" min={RADIUS_MIN} max={RADIUS_MAX} step={10} value={form.radius} onChange={set('radius')} />
          <small className="muted">Check-in only unlocks inside this circle.</small>
        </label>

        <label className="field">
          <span>Commitment amount (£)</span>
          <div className="input-prefix">
            <span>£</span>
            <input type="number" min="1" max="100" step="0.5" value={form.amount} onChange={set('amount')} disabled={hasCommitments} />
          </div>
          {hasCommitments ? (
            <small className="muted">
              <Lock size={12} /> Locked — people have already committed.
            </small>
          ) : (
            <small className="muted">Everyone holds this amount. No-shows lose it.</small>
          )}
          {errors.amount && <small className="form-error">{errors.amount}</small>}
        </label>

        <div className="field">
          <span>Grace period</span>
          <div className="segmented">
            {GRACE_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                className={Number(form.graceMinutes) === m ? 'is-active' : ''}
                onClick={() => setForm((f) => ({ ...f, graceMinutes: m }))}
              >
                {m} min
              </button>
            ))}
          </div>
          <small className="muted">Time after the start to check in before money moves.</small>
        </div>

        <label className="field toggle-field">
          <span className="toggle-field__text">
            <Repeat size={16} /> Repeat weekly
            <small className="muted">The next one is scheduled after each settlement.</small>
          </span>
          <input type="checkbox" className="switch" checked={form.repeatWeekly} onChange={set('repeatWeekly')} />
        </label>

        <div className="field field--full">
          <span>Invite friends ({form.invitees.length})</span>
          {friends.length + extraMembers.length === 0 ? (
            <p className="muted small">You have no friends yet — add some from Community.</p>
          ) : (
            <div className="invite-grid">
              {[...friends, ...extraMembers].map((u) => {
                const selected = form.invitees.includes(u.id)
                const locked = event?.members[u.id]?.status === 'committed'
                return (
                  <button
                    type="button"
                    key={u.id}
                    className={`invite-option${selected ? ' is-selected' : ''}`}
                    onClick={() => toggleInvitee(u.id)}
                    title={locked ? 'Committed — cannot be removed' : ''}
                  >
                    <Avatar user={u} size={30} />
                    <span>{u.name}</span>
                    {locked && <Lock size={12} />}
                  </button>
                )
              })}
            </div>
          )}
          <small className="muted">You're the admin. Invited friends form this event's group.</small>
        </div>
      </form>
    </Modal>
  )
}
