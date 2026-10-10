// Pure event helpers: timing, phases, recurrence and settlement of app state.
import { CHECKIN_EARLY_MINUTES, ME_ID, PAYMENT_SETTLE_MS } from './constants'
import { computeSettlement } from './settlement'
import { formatDate, formatMoney, makeReference, toDateInput, uid } from './format'

const MINUTE = 60000
const DAY = 86400000

export function newMember(status = 'invited') {
  return { status, committedAt: null, checkedInAt: null, checkInDistance: null }
}

export function buildEventTimes(date, time, graceMinutes) {
  const startAt = new Date(`${date}T${time}`).getTime()
  return { startAt, graceEndsAt: startAt + graceMinutes * MINUTE }
}

// upcoming → checkin-open (30 min before) → grace (after start) → settling → settled
export function getPhase(event, now) {
  if (event.settled) return 'settled'
  if (now < event.startAt - CHECKIN_EARLY_MINUTES * MINUTE) return 'upcoming'
  if (now < event.startAt) return 'checkin-open'
  if (now < event.graceEndsAt) return 'grace'
  return 'settling'
}

export const PHASE_LABELS = {
  upcoming: 'Upcoming',
  'checkin-open': 'Check-in open',
  grace: 'Grace period',
  settling: 'Settling…',
  settled: 'Settled',
}

export const canCommitInPhase = (phase) => phase === 'upcoming' || phase === 'checkin-open'
export const canCheckInPhase = (phase) => phase === 'checkin-open' || phase === 'grace'

// Stable Starling payment reference for an event (fixed when it's created,
// so it doesn't change if the demo "Start event now" moves the start time).
export function eventReference(event) {
  return event.reference ?? makeReference(event.title, event.startAt)
}

export function heldTotal(event) {
  return Object.values(event.members).filter((m) => m.status === 'committed').length * event.amount
}

export function memberCounts(event) {
  const members = Object.values(event.members)
  return {
    total: members.length,
    committed: members.filter((m) => m.status === 'committed').length,
    checkedIn: members.filter((m) => m.checkedInAt).length,
    declined: members.filter((m) => m.status === 'declined').length,
  }
}

// Does this event (or its weekly repeat) fall on yyyy-mm-dd?
export function occursOn(event, dateStr) {
  if (event.date === dateStr) return 'actual'
  if (!event.repeatWeekly || event.settled || dateStr < event.date) return null
  const diff = Math.round(
    (new Date(`${dateStr}T00:00`).getTime() - new Date(`${event.date}T00:00`).getTime()) / DAY,
  )
  return diff > 0 && diff % 7 === 0 ? 'repeat' : null
}

function addNotification(state, text, link, kind = 'info', now = Date.now()) {
  return {
    ...state,
    notifications: [
      { id: uid('ntf'), text, link, kind, read: false, time: now },
      ...state.notifications,
    ].slice(0, 50),
  }
}

export { addNotification }

export function addTransaction(state, tx, now = Date.now()) {
  return {
    ...state,
    transactions: [{ id: uid('tx'), time: now, space: 'available', status: 'completed', ...tx }, ...state.transactions],
  }
}

// Releases all held money for an event and moves it to the right people.
export function settleEventInState(state, eventId, now = Date.now()) {
  const event = state.events.find((e) => e.id === eventId)
  if (!event || event.settled) return state

  const result = computeSettlement(event)
  const users = { ...state.users }
  result.committed.forEach((id) => {
    const user = users[id]
    if (!user) return
    users[id] = {
      ...user,
      held: Math.max(0, user.held - event.amount),
      balance: user.balance + (result.payouts[id] || 0),
    }
  })

  let next = {
    ...state,
    users,
    events: state.events.map((e) =>
      e.id === eventId
        ? { ...e, settled: true, graceEndsAt: Math.min(e.graceEndsAt, now), settlement: { ...result, settledAt: now } }
        : e,
    ),
  }

  // Starling activity + notifications for the logged-in user.
  // Refunds come straight back from the Space; penalty shares travel by
  // Faster Payment, so they show as "Pending" for a few seconds first.
  const link = `/events/${eventId}/settlement`
  const reference = eventReference(event)
  const pendingUntil = now + PAYMENT_SETTLE_MS
  const names = (ids) => ids.map((id) => (id === ME_ID ? 'you' : state.users[id]?.name.split(' ')[0])).join(', ')
  if (result.committed.includes(ME_ID)) {
    const payout = result.payouts[ME_ID] || 0
    if (result.refundedAll) {
      next = addTransaction(next, { type: 'refund', amount: event.amount, label: `Refunded — nobody checked in · ${event.title}`, route: 'Show up! Space → Main', reference, eventId }, now)
      next = addNotification(next, `${event.title}: nobody checked in, so everyone was refunded.`, link, 'info', now)
    } else if (payout > 0) {
      next = addTransaction(next, { type: 'refund', amount: event.amount, label: `Commitment returned · ${event.title}`, route: 'Show up! Space → Main', reference, eventId }, now)
      if (payout > event.amount) {
        next = addTransaction(next, { type: 'payout', amount: payout - event.amount, label: `Penalty share · ${event.title}`, sub: `from ${names(result.noShows)}`, route: 'Faster Payment → Main', status: 'pending', completesAt: pendingUntil, reference, eventId }, now)
      }
      next = addNotification(next, `You showed up to ${event.title} — ${formatMoney(event.amount)} is back in your Starling account${payout > event.amount ? `, plus ${formatMoney(payout - event.amount)} on its way` : ''}.`, link, 'success', now)
    } else {
      next = addTransaction(next, { type: 'forfeit', amount: -event.amount, space: 'held', label: `Missed ${event.title} — paid to attendees`, sub: `to ${names(result.attendees)}`, route: 'Show up! Space → Faster Payment', status: 'pending', completesAt: pendingUntil, reference, eventId }, now)
      next = addNotification(next, `You missed ${event.title}. Your ${formatMoney(event.amount)} is being paid to the friends who came.`, link, 'warning', now)
    }
  } else if (event.adminId === ME_ID) {
    next = addNotification(next, `${event.title} has been settled.`, link, 'info', now)
  }

  // Memory (last step of the journey).
  if (event.members[ME_ID]) {
    next = {
      ...next,
      memories: [
        {
          id: uid('mem'),
          eventId,
          title: event.title,
          activity: event.activity,
          date: event.startAt,
          venueName: event.venue.name,
          attendees: result.attendees,
          noShows: result.refundedAll ? [] : result.noShows,
          myResult: (result.payouts[ME_ID] || 0) - (result.committed.includes(ME_ID) ? event.amount : 0),
          note: '',
          createdAt: now,
        },
        ...next.memories,
      ],
    }
  }

  // Recurring: schedule next week's occurrence.
  if (event.repeatWeekly) {
    const exists = next.events.some((e) => e.seriesId === event.seriesId && e.startAt > event.startAt)
    if (!exists) {
      const nextDate = toDateInput(new Date(`${event.date}T00:00`).getTime() + 7 * DAY + 12 * 3600000)
      const times = buildEventTimes(nextDate, event.time, event.graceMinutes)
      const members = {}
      Object.entries(event.members).forEach(([id, m]) => {
        if (m.status !== 'declined') members[id] = newMember()
      })
      const nextEvent = {
        ...event,
        id: uid('evt'),
        date: nextDate,
        ...times,
        reference: makeReference(event.title, times.startAt),
        members,
        settled: false,
        settlement: null,
        demoFast: false,
        createdAt: now,
      }
      next = { ...next, events: [...next.events, nextEvent] }
      next = addNotification(next, `Next ${event.title} is scheduled for ${formatDate(times.startAt)}.`, `/events/${nextEvent.id}`, 'info', now)
    }
  }

  return next
}

// Refund every held commitment for an event (used when deleting it).
export function refundEventInState(state, event, reason) {
  const users = { ...state.users }
  let next = state
  Object.entries(event.members).forEach(([id, m]) => {
    if (m.status !== 'committed' || event.settled) return
    const u = users[id]
    users[id] = { ...u, held: Math.max(0, u.held - event.amount), balance: u.balance + event.amount }
    if (id === ME_ID) {
      next = addTransaction(next, { type: 'refund', amount: event.amount, label: `${reason} · ${event.title}`, route: 'Show up! Space → Main', reference: eventReference(event), eventId: event.id })
    }
  })
  return { ...next, users }
}
