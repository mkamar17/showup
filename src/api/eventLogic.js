// Pure event helpers: timing, phases, recurrence and settlement of app state.
import { CHECKIN_EARLY_MINUTES, DEMO_GRACE_SPEED, ME_ID, PAYMENT_SETTLE_MS } from './constants'
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

// A member's own check-in deadline: the grace period, plus any TfL extension.
export function memberDeadline(event, id) {
  return Math.max(event.graceEndsAt, event.members[id]?.extendedUntil ?? 0)
}

// The event settles once the last personal deadline has passed.
export function settleAt(event) {
  return Math.max(event.graceEndsAt, ...Object.values(event.members).map((m) => m.extendedUntil ?? 0))
}

// upcoming → checkin-open (30 min before) → grace (after start)
// → overtime (only TfL-delayed members can still check in) → settling → settled
export function getPhase(event, now) {
  if (event.cancelled) return 'cancelled'
  if (event.settled) return 'settled'
  if (now < event.startAt - CHECKIN_EARLY_MINUTES * MINUTE) return 'upcoming'
  if (now < event.startAt) return 'checkin-open'
  if (now < event.graceEndsAt) return 'grace'
  if (now < settleAt(event)) return 'overtime'
  return 'settling'
}

export const PHASE_LABELS = {
  upcoming: 'Upcoming',
  'checkin-open': 'Check-in open',
  grace: 'Grace period',
  overtime: 'Extra time (TfL)',
  settling: 'Settling…',
  settled: 'Settled',
  cancelled: 'Cancelled',
}

// Finished one way or another: settled after it ran, or cancelled before.
export const isClosed = (event) => Boolean(event.settled || event.cancelled)

// The admin can call an event off only before it starts. After that, the
// outcome is decided by check-ins, so a late admin can't cancel to save
// their own commitment at the expense of friends who turned up.
export const canCancel = (event, now) => !isClosed(event) && now < event.startAt

export const canCommitInPhase = (phase) => phase === 'upcoming' || phase === 'checkin-open'
export const canCheckInPhase = (phase) => phase === 'checkin-open' || phase === 'grace'

// Can this member still check in right now? (Excused members are out.)
export function canMemberCheckIn(event, id, now) {
  const m = event.members[id]
  if (!m || m.status !== 'committed' || m.checkedInAt || m.excused || isClosed(event)) return false
  const phase = getPhase(event, now)
  return canCheckInPhase(phase) || (phase === 'overtime' && now < memberDeadline(event, id))
}

// Stable Starling payment reference for an event (fixed when it's created,
// so it doesn't change if the demo "Start event now" moves the start time).
export function eventReference(event) {
  return event.reference ?? makeReference(event.title, event.startAt)
}

export function heldTotal(event) {
  return Object.values(event.members).filter((m) => m.status === 'committed' && !m.excused).length * event.amount
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

// A user's track record across settled events, from each event's stored
// settlement (amounts in pence):
// - returned: commitments given back (showed up, or nobody checked in)
// - earned:   shares of no-shows' commitments on top of that
// - lost:     commitments forfeited by not showing up
// (A TfL-excused commitment counts as returned.)
export function moneyRecord(events, userId) {
  const record = { returned: 0, earned: 0, lost: 0, showedUp: 0, missed: 0 }
  events.forEach((e) => {
    const s = e.settled && e.settlement
    if (s?.excused?.includes(userId)) record.returned += s.amount
    if (!s || !s.committed.includes(userId)) return
    const payout = s.payouts[userId] || 0
    if (payout > 0) {
      record.returned += s.amount
      record.earned += payout - s.amount
      if (s.attendees.includes(userId)) record.showedUp += 1
    } else {
      record.lost += s.amount
      record.missed += 1
    }
  })
  return record
}

// Memories: everyone who joined (committed to) an event can see its photos
// and add their own, whether or not they made it on the day.
export function canShareMemories(event, userId) {
  return event?.members[userId]?.status === 'committed'
}

// Memories a user can see: ones for events they joined, newest first.
// (A record without a `committed` list predates it and is the user's own.)
export function visibleMemories(memories, userId) {
  return memories.filter((m) => !m.committed || m.committed.includes(userId)).sort((a, b) => b.date - a.date)
}

// An event's photos, oldest first (the order the day happened in).
export function photosForEvent(photos, eventId) {
  return photos.filter((p) => p.eventId === eventId).sort((a, b) => a.createdAt - b.createdAt)
}

// How a settled event went for one person: what happened and what it meant
// for their money (pence). `kind` is showed | missed | refunded | none.
export function settledOutcome(event, userId) {
  const s = event.settlement
  if (s?.excused?.includes(userId)) return { kind: 'excused', net: 0 }
  if (!s || !s.committed.includes(userId)) return { kind: 'none', net: 0 }
  const payout = s.payouts[userId] || 0
  const net = payout - s.amount
  if (s.refundedAll) return { kind: 'refunded', net }
  if (s.attendees.includes(userId)) return { kind: 'showed', net }
  return { kind: 'missed', net }
}

// Does this event (or its weekly repeat) fall on yyyy-mm-dd?
export function occursOn(event, dateStr) {
  if (event.date === dateStr) return 'actual'
  if (!event.repeatWeekly || isClosed(event) || dateStr < event.date) return null
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
  if (!event || isClosed(event)) return state

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

  // Memory (last step of the journey): the event becomes its own photo
  // collection, so nudge the people who joined to add what they captured.
  const joined = [...result.committed, ...result.excused]
  if (joined.includes(ME_ID) && !next.memories.some((m) => m.eventId === eventId)) {
    next = addNotification(next, `Got photos from ${event.title}? Add them to the memory.`, `/memories/${eventId}`, 'info', now)
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
          committed: joined,
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

  return scheduleNextOccurrence(next, event, now)
}

// Weekly events: once one occurrence is over (settled or cancelled), put the
// next one in the calendar with everyone re-invited.
function scheduleNextOccurrence(state, event, now) {
  if (!event.repeatWeekly) return state
  const exists = state.events.some((e) => e.seriesId === event.seriesId && e.startAt > event.startAt)
  if (exists) return state
  const nextDate = toDateInput(new Date(`${event.date}T00:00`).getTime() + 7 * DAY + 12 * 3600000)
  const times = buildEventTimes(nextDate, event.time, event.graceMinutes)
  const members = {}
  Object.entries(event.members).forEach(([id, m]) => {
    if (m.status !== 'declined') members[id] = newMember()
  })
  const { cancelled: _cancelled, lateRequest: _lateRequest, ...template } = event
  const nextEvent = {
    ...template,
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
  const next = { ...state, events: [...state.events, nextEvent] }
  return addNotification(next, `Next ${event.title} is scheduled for ${formatDate(times.startAt)}.`, `/events/${nextEvent.id}`, 'info', now)
}

// Calls an event off before it starts: every held commitment goes back to
// its owner, and the event stays visible as cancelled (with who and why).
export function cancelEventInState(state, eventId, { by, message = '' }, now = Date.now()) {
  const event = state.events.find((e) => e.id === eventId)
  if (!event || isClosed(event)) return state
  let next = refundEventInState(state, event, 'Event cancelled — refunded')
  next = {
    ...next,
    events: next.events.map((e) => (e.id === eventId ? { ...e, cancelled: { at: now, by, message: message.trim() } } : e)),
  }
  if (event.members[ME_ID] && by !== ME_ID) {
    const mine = event.members[ME_ID].status === 'committed' ? ` Your ${formatMoney(event.amount)} is back in your Starling account.` : ''
    next = addNotification(next, `${event.title} was cancelled.${mine}`, `/events/${eventId}`, 'info', now)
  }
  return scheduleNextOccurrence(next, event, now)
}

// TfL delay protection for one member, applied straight from TfL's answer
// (no organiser approval: the data is the proof).
//   release → their commitment goes back now; they're out of the pot
//   extend  → their own check-in deadline moves back
//   none    → nothing changes; the TfL result is kept so they can see why
export function applyTransportProtection(state, eventId, userId, tfl, protection, now = Date.now()) {
  const event = state.events.find((e) => e.id === eventId)
  const m = event?.members[userId]
  if (!m || m.status !== 'committed' || m.checkedInAt || m.excused || isClosed(event)) return state

  let next = state
  let member = { ...m, delay: { status: protection.outcome, tfl, why: protection.why, at: now } }

  if (protection.outcome === 'release') {
    const u = state.users[userId]
    next = { ...next, users: { ...next.users, [userId]: { ...u, held: Math.max(0, u.held - event.amount), balance: u.balance + event.amount } } }
    member = { ...member, excused: { by: 'tfl', at: now, lineName: tfl.lineName, label: tfl.label, reason: tfl.reason } }
    if (userId === ME_ID) {
      next = addTransaction(next, { type: 'refund', amount: event.amount, label: `Released by TfL protection · ${event.title}`, sub: `${tfl.lineName}: ${tfl.label}`, route: 'Show up! Space → Main', reference: eventReference(event), eventId }, now)
      next = addNotification(next, `TfL confirmed ${tfl.lineName}: ${tfl.label}. Your ${formatMoney(event.amount)} for ${event.title} is back in your account.`, `/events/${eventId}`, 'success', now)
    } else if (event.adminId === ME_ID) {
      next = addNotification(next, `${u.name} was excused from ${event.title}: TfL reports ${tfl.lineName} ${tfl.label.toLowerCase()}.`, `/events/${eventId}`, 'info', now)
    }
  }

  if (protection.outcome === 'extend') {
    // Demo events run their clock faster, so extensions shrink to match.
    const minutes = event.demoFast ? protection.minutes / DEMO_GRACE_SPEED : protection.minutes
    member = { ...member, extendedUntil: memberDeadline(event, userId) + minutes * MINUTE, delay: { ...member.delay, minutes: protection.minutes } }
  }

  return {
    ...next,
    events: next.events.map((e) => (e.id === eventId ? { ...e, members: { ...e.members, [userId]: member } } : e)),
  }
}

// Refund every held commitment for an event (deleting or cancelling it).
export function refundEventInState(state, event, reason) {
  const users = { ...state.users }
  let next = state
  Object.entries(event.members).forEach(([id, m]) => {
    if (m.status !== 'committed' || m.excused || isClosed(event)) return
    const u = users[id]
    users[id] = { ...u, held: Math.max(0, u.held - event.amount), balance: u.balance + event.amount }
    if (id === ME_ID) {
      next = addTransaction(next, { type: 'refund', amount: event.amount, label: `${reason} · ${event.title}`, route: 'Show up! Space → Main', reference: eventReference(event), eventId: event.id })
    }
  })
  return { ...next, users }
}
