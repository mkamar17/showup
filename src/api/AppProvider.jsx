// App-wide mock "backend": state, actions, a 1-second clock and location.
// Everything is saved to localStorage so the demo survives refreshes.
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppContext } from './context'
import { ME_ID, DEMO_GRACE_SPEED } from './constants'
import { createSeedState } from './seedData'
import { loadState, saveState, clearState } from './storage'
import { clearImages, deleteImages } from './photoStore'
import {
  addNotification,
  addTransaction,
  applyTransportProtection,
  buildEventTimes,
  canCancel,
  canCommitInPhase,
  canMemberCheckIn,
  cancelEventInState,
  eventReference,
  getPhase,
  isClosed,
  newMember,
  refundEventInState,
  settleAt,
  settleEventInState,
} from './eventLogic'
import { formatMoney, makeReference, toDateInput, toTimeInput, uid } from './format'
import { demoTfLStatus, getTfLLineStatus, protectionFor } from './tflApi'

export function AppProvider({ children }) {
  const [state, setState] = useState(() => loadState() ?? createSeedState())
  const [now, setNow] = useState(() => Date.now())
  const [toasts, setToasts] = useState([])

  // Location: real GPS (watchPosition) or a simulated point for demos.
  const [location, setLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('idle') // idle | locating | active | simulated | error
  const [locationError, setLocationError] = useState('')
  const watchId = useRef(null)

  useEffect(() => {
    saveState(state)
  }, [state])

  // Clock: ticks every second and auto-settles events whose grace period ended.
  useEffect(() => {
    const timer = setInterval(() => {
      const n = Date.now()
      setNow(n)
      setState((s) => {
        let next = s
        const due = s.events.filter((e) => !isClosed(e) && n >= settleAt(e))
        if (due.length) next = due.reduce((acc, e) => settleEventInState(acc, e.id, n), next)

        // Mock Faster Payments: "Pending" → "Completed" after a few seconds.
        const arrived = next.transactions.filter((t) => t.status === 'pending' && t.completesAt <= n)
        if (arrived.length) {
          next = {
            ...next,
            transactions: next.transactions.map((t) =>
              t.status === 'pending' && t.completesAt <= n ? { ...t, status: 'completed' } : t,
            ),
          }
          arrived
            .filter((t) => t.amount > 0)
            .forEach((t) => {
              next = addNotification(next, `${formatMoney(t.amount)} arrived in your Starling account (${t.label}).`, '/profile?tab=wallet', 'success', n)
            })
        }
        return next
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const stopWatching = useCallback(() => {
    if (watchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current)
    }
    watchId.current = null
  }, [])

  useEffect(() => stopWatching, [stopWatching])

  // ---------- Toasts ----------
  const toast = useCallback((message, type = 'info') => {
    const id = uid('toast')
    setToasts((t) => [...t.slice(-2), { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  const dismissToast = (id) => setToasts((t) => t.filter((x) => x.id !== id))

  const me = state.session ? state.users[state.session.userId] : null

  // ---------- Auth (mock) ----------
  function login({ username, name, email }) {
    const clean = username.trim().toLowerCase()
    const taken = Object.values(state.users).some((u) => u.id !== ME_ID && u.username === clean)
    if (taken) return { ok: false, message: `@${clean} belongs to a demo friend — pick another username.` }
    const currentName = state.users[ME_ID].name
    const displayName =
      name?.trim() || (currentName !== 'Demo User' ? currentName : clean.charAt(0).toUpperCase() + clean.slice(1))
    setState((s) => {
      const next = {
        ...s,
        session: { userId: ME_ID, loggedInAt: Date.now() },
        users: {
          ...s.users,
          [ME_ID]: {
            ...s.users[ME_ID],
            username: clean,
            name: displayName,
            email: email?.trim() || s.users[ME_ID].email,
          },
        },
      }
      return addNotification(next, `Welcome to Show up!, ${displayName}! Add friends, create an event and commit.`, '/community', 'info')
    })
    return { ok: true }
  }

  function logout() {
    stopWatching()
    setLocation(null)
    setLocationStatus('idle')
    setState((s) => ({ ...s, session: null }))
  }

  function resetDemo() {
    stopWatching()
    setLocation(null)
    setLocationStatus('idle')
    clearState()
    clearImages().catch(() => {})
    const fresh = createSeedState()
    setState((s) => ({
      ...fresh,
      session: s.session,
      users: { ...fresh.users, [ME_ID]: { ...fresh.users[ME_ID], username: s.users[ME_ID].username, name: s.users[ME_ID].name, email: s.users[ME_ID].email } },
    }))
    toast('Demo data reset', 'success')
  }

  // ---------- Profile & wallet ----------
  function updateProfile(fields) {
    setState((s) => ({ ...s, users: { ...s.users, [ME_ID]: { ...s.users[ME_ID], ...fields } } }))
    toast('Profile saved', 'success')
  }

  // ---------- Starling (mock) ----------
  // In a real build these call a small backend that talks to Starling's API
  // (OAuth, savings goals = Spaces, payments). Here they just update state.
  function updateMe(fn) {
    setState((s) => ({ ...s, users: { ...s.users, [ME_ID]: fn(s.users[ME_ID]) } }))
  }

  function connectStarling() {
    const t = Date.now()
    setState((s) =>
      addNotification(
        {
          ...s,
          users: {
            ...s.users,
            [ME_ID]: {
              ...s.users[ME_ID],
              starling: {
                accountName: s.users[ME_ID].name,
                accountLast4: '5678',
                sortLast2: '71',
                spaceName: 'Show up! Commitments',
                connectedAt: t,
                lastSyncedAt: t,
              },
            },
          },
        },
        'Starling connected — your “Show up! Commitments” Space is ready.',
        '/profile?tab=wallet',
        'success',
      ),
    )
    toast('Starling account connected', 'success')
  }

  function disconnectStarling() {
    if (me.held > 0) {
      toast(`${formatMoney(me.held)} is still held in your Show up! Space — disconnect after your events settle.`, 'error')
      return false
    }
    updateMe((u) => ({ ...u, starling: null }))
    toast('Starling disconnected')
    return true
  }

  function syncStarling() {
    updateMe((u) => ({ ...u, starling: { ...u.starling, lastSyncedAt: Date.now() } }))
    toast('Balance refreshed from Starling', 'success')
  }

  // Demo helper: pretend money arrived in the Starling account.
  function demoAddFunds(amount) {
    setState((s) => {
      const u = s.users[ME_ID]
      const next = { ...s, users: { ...s.users, [ME_ID]: { ...u, balance: u.balance + amount } } }
      return addTransaction(next, { type: 'topup', amount, label: 'Money received (demo)', route: 'Bank transfer → Main', reference: 'DEMO' })
    })
    toast(`${formatMoney(amount)} added to your Starling balance (demo)`, 'success')
  }

  // ---------- Friends ----------
  function addFriend(username) {
    const clean = username.trim().replace(/^@/, '').toLowerCase()
    if (!clean) return { ok: false, message: 'Enter a username' }
    if (clean === me.username) return { ok: false, message: "That's you!" }
    const user = Object.values(state.users).find((u) => u.username === clean)
    if (!user) return { ok: false, message: `No one found with username @${clean}` }
    if (state.friends.includes(user.id)) return { ok: false, message: `${user.name} is already your friend` }
    setState((s) => addNotification({ ...s, friends: [...s.friends, user.id] }, `You and ${user.name} are now friends.`, '/community', 'success'))
    toast(`${user.name} added as a friend`, 'success')
    return { ok: true }
  }

  function removeFriend(userId) {
    setState((s) => ({ ...s, friends: s.friends.filter((id) => id !== userId) }))
    toast(`${state.users[userId].name} removed from friends`)
  }

  // ---------- Events ----------
  function formToEventFields(form) {
    return {
      title: form.title.trim(),
      activity: form.activity,
      date: form.date,
      time: form.time,
      venue: form.venue,
      radius: Number(form.radius),
      amount: Math.round(Number(form.amount) * 100),
      graceMinutes: Number(form.graceMinutes),
      repeatWeekly: form.repeatWeekly,
      ...buildEventTimes(form.date, form.time, Number(form.graceMinutes)),
    }
  }

  function createEvent(form) {
    const id = uid('evt')
    const members = { [ME_ID]: newMember() }
    form.invitees.forEach((fid) => {
      members[fid] = newMember()
    })
    const fields = formToEventFields(form)
    const event = {
      id,
      seriesId: id,
      ...fields,
      reference: makeReference(fields.title, fields.startAt),
      adminId: ME_ID,
      members,
      settled: false,
      settlement: null,
      demoFast: false,
      createdAt: Date.now(),
    }
    setState((s) => ({ ...s, events: [...s.events, event] }))
    toast(`${event.title} created${form.invitees.length ? ` — ${form.invitees.length} friend${form.invitees.length > 1 ? 's' : ''} invited` : ''}`, 'success')
    return id
  }

  function updateEvent(eventId, form) {
    setState((s) => {
      const ev = s.events.find((e) => e.id === eventId)
      if (!ev) return s
      let next = s
      const fields = formToEventFields(form)
      const members = { [ME_ID]: ev.members[ME_ID] ?? newMember() }
      form.invitees.forEach((fid) => {
        members[fid] = ev.members[fid] ?? newMember()
      })
      // Anyone removed who had committed gets refunded.
      const removed = Object.keys(ev.members).filter((id) => !members[id])
      if (removed.length) {
        const removedEvent = { ...ev, members: Object.fromEntries(removed.map((id) => [id, ev.members[id]])) }
        next = refundEventInState(next, removedEvent, 'Removed from event')
      }
      return {
        ...next,
        events: next.events.map((e) =>
          e.id === eventId ? { ...e, ...fields, amount: heldCount(ev) ? ev.amount : fields.amount, members } : e,
        ),
      }
    })
    toast('Event updated', 'success')
  }

  function deleteEvent(eventId) {
    const ev = state.events.find((e) => e.id === eventId)
    if (!ev) return
    setState((s) => {
      const next = refundEventInState(s, ev, 'Event deleted — refunded')
      return { ...next, events: next.events.filter((e) => e.id !== eventId) }
    })
    toast(`${ev.title} deleted${heldCount(ev) && !ev.settled ? ' — all commitments refunded' : ''}`)
  }

  // Admin calls the event off before it starts: everyone's money goes back.
  function cancelEvent(eventId, message) {
    const ev = state.events.find((e) => e.id === eventId)
    if (!ev || ev.adminId !== ME_ID || !canCancel(ev, Date.now())) return
    setState((s) => cancelEventInState(s, eventId, { by: ME_ID, message }, Date.now()))
    const n = heldCount(ev)
    toast(`${ev.title} cancelled${n ? ` — ${formatMoney(ev.amount)} returned to ${n} ${n === 1 ? 'person' : 'people'}` : ''}`, 'success')
  }

  function inviteToEvent(eventId, userIds) {
    setState((s) => ({
      ...s,
      events: s.events.map((e) => {
        if (e.id !== eventId) return e
        const members = { ...e.members }
        userIds.forEach((id) => {
          if (!members[id]) members[id] = newMember()
        })
        return { ...e, members }
      }),
    }))
    toast('Invite sent', 'success')
  }

  // "Join & commit £X": moves money from the Starling main account into the
  // Show up! Commitments Space (after the user approves it in the bank app).
  // Returns the payment reference, or null if it couldn't happen.
  function commit(eventId, userId = ME_ID) {
    const ev = state.events.find((e) => e.id === eventId)
    const user = state.users[userId]
    if (!ev || !user) return null
    if (!canCommitInPhase(getPhase(ev, Date.now()))) {
      toast('Commitments are closed — the event has started', 'error')
      return null
    }
    if (userId === ME_ID && !user.starling) {
      toast('Connect your Starling account first (Profile → Banking)', 'error')
      return null
    }
    if (user.balance < ev.amount) {
      toast(userId === ME_ID ? 'Not enough money in your Starling account' : `${user.name} doesn't have enough in their account`, 'error')
      return null
    }
    const reference = eventReference(ev)
    setState((s) => {
      const u = s.users[userId]
      const e = s.events.find((x) => x.id === eventId)
      if (e.members[userId]?.status === 'committed') return s
      let next = {
        ...s,
        users: { ...s.users, [userId]: { ...u, balance: u.balance - e.amount, held: u.held + e.amount } },
        events: s.events.map((x) =>
          x.id === eventId
            ? { ...x, members: { ...x.members, [userId]: { ...newMember('committed'), committedAt: Date.now() } } }
            : x,
        ),
      }
      if (userId === ME_ID) {
        next = addTransaction(next, { type: 'hold', amount: -e.amount, label: `Committed to ${e.title}`, route: 'Main → Show up! Space', reference, eventId })
      } else if (e.adminId === ME_ID) {
        next = addNotification(next, `${u.name} committed ${formatMoney(e.amount)} to ${e.title}.`, `/events/${eventId}`, 'success')
      }
      return next
    })
    if (userId !== ME_ID) toast(`${user.name} committed ${formatMoney(ev.amount)}`, 'success')
    return reference
  }

  function decline(eventId) {
    setState((s) => ({
      ...s,
      events: s.events.map((e) =>
        e.id === eventId ? { ...e, members: { ...e.members, [ME_ID]: newMember('declined') } } : e,
      ),
    }))
    toast('You declined this event')
  }

  function checkIn(eventId, userId = ME_ID, distance = null) {
    const ev = state.events.find((e) => e.id === eventId)
    if (!ev || !canMemberCheckIn(ev, userId, Date.now())) return
    setState((s) => {
      let next = {
        ...s,
        events: s.events.map((e) =>
          e.id === eventId
            ? {
                ...e,
                members: {
                  ...e.members,
                  [userId]: { ...e.members[userId], checkedInAt: Date.now(), checkInDistance: distance },
                },
              }
            : e,
        ),
      }
      if (userId !== ME_ID && ev.adminId === ME_ID) {
        next = addNotification(next, `${s.users[userId].name} checked in to ${ev.title}.`, `/events/${eventId}`, 'success')
      }
      return next
    })
    toast(userId === ME_ID ? "You're checked in — your money is safe 🎉" : `${state.users[userId].name} checked in`, 'success')
  }

  // Demo: start now, with a sped-up grace period.
  function startEventNow(eventId) {
    const t = Date.now()
    setState((s) => ({
      ...s,
      events: s.events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              date: toDateInput(t),
              time: toTimeInput(t),
              startAt: t,
              graceEndsAt: t + (e.graceMinutes * 60000) / DEMO_GRACE_SPEED,
              demoFast: true,
            }
          : e,
      ),
    }))
    toast('Event started — grace period is running (sped up for the demo)', 'success')
  }

  function endGracePeriod(eventId) {
    setState((s) => settleEventInState(s, eventId, Date.now()))
    toast('Grace period ended — settlement complete', 'success')
  }

  // ---------- TfL delay protection ----------
  // TfL's answer decides automatically (see protectionFor): a suspension
  // releases your commitment, delays extend your own deadline. `demoLabel`
  // pretends TfL returned that status, for presenting on a calm day.
  async function checkTransportDelay(eventId, lineId, demoLabel = null) {
    const setDelay = (delay) =>
      setState((s) => ({
        ...s,
        events: s.events.map((e) =>
          e.id === eventId ? { ...e, members: { ...e.members, [ME_ID]: { ...e.members[ME_ID], delay } } } : e,
        ),
      }))

    setDelay({ status: 'checking', lineId, at: Date.now() })
    try {
      const tfl = demoLabel ? demoTfLStatus(lineId, demoLabel) : await getTfLLineStatus(lineId)
      const protection = protectionFor(tfl.label)
      setState((s) => applyTransportProtection(s, eventId, ME_ID, tfl, protection, Date.now()))
      if (protection.outcome === 'release') toast(`TfL confirmed ${tfl.label.toLowerCase()}: your commitment is back in your account`, 'success')
      else if (protection.outcome === 'extend') toast(`TfL confirmed ${tfl.label.toLowerCase()}: you have ${protection.minutes} more minutes`, 'success')
      else toast(`TfL reports ${tfl.label} on the ${tfl.lineName}`)
    } catch (error) {
      setDelay({ status: 'error', lineId, error: error.message, at: Date.now() })
      toast('Could not reach TfL. Try again.', 'error')
    }
  }

  // Clears a "no disruption found" or failed check so another line can be tried.
  function clearTransportDelay(eventId) {
    setState((s) => ({
      ...s,
      events: s.events.map((e) => {
        const m = e.members[ME_ID]
        if (e.id !== eventId || !['none', 'error'].includes(m?.delay?.status)) return e
        const { delay: _delay, ...rest } = m
        return { ...e, members: { ...e.members, [ME_ID]: rest } }
      }),
    }))
  }

  // Demo: a friend's line is suspended, so they're excused by TfL.
  function simulateFriendTransport(eventId, userId, label = 'Suspended', lineId = 'central') {
    const tfl = demoTfLStatus(lineId, label)
    setState((s) => applyTransportProtection(s, eventId, userId, tfl, protectionFor(label), Date.now()))
    toast(`${state.users[userId].name}: TfL reports ${tfl.lineName} ${label.toLowerCase()}`)
  }

  // ---------- Notifications ----------
  const markNotificationRead = (id) =>
    setState((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }))
  const markAllRead = () => setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }))
  const clearNotifications = () => setState((s) => ({ ...s, notifications: [] }))

  // ---------- Memories ----------
  function updateMemory(id, note) {
    setState((s) => ({ ...s, memories: s.memories.map((m) => (m.id === id ? { ...m, note } : m)) }))
    toast('Memory saved', 'success')
  }

  // Photo metadata only; the image files are saved by photoStore first.
  function addPhotos(eventId, photos) {
    const createdAt = Date.now()
    const records = photos.map(({ id, width, height }, i) => ({ id, eventId, uploadedBy: ME_ID, width, height, createdAt: createdAt + i }))
    setState((s) => ({ ...s, photos: [...s.photos, ...records] }))
  }

  // Uploaders can remove their own photos; the event's admin can remove any.
  function removePhoto(id) {
    setState((s) => ({ ...s, photos: s.photos.filter((p) => p.id !== id) }))
    deleteImages(id).catch(() => {})
    toast('Photo removed')
  }

  // ---------- Location ----------
  function requestGps() {
    if (!('geolocation' in navigator)) {
      setLocationStatus('error')
      setLocationError('This browser does not support location. Use “Simulate arrival”.')
      return
    }
    stopWatching()
    setLocationStatus('locating')
    setLocationError('')
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, source: 'gps' })
        setLocationStatus('active')
      },
      (err) => {
        setLocationStatus('error')
        setLocationError(
          err.code === 1
            ? 'Location permission denied. Allow it in your browser, or use “Simulate arrival”.'
            : 'Could not get your location. Try again or use “Simulate arrival”.',
        )
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )
  }

  function simulateLocation(point) {
    stopWatching()
    setLocation({ ...point, accuracy: 5, source: 'simulated' })
    setLocationStatus('simulated')
    setLocationError('')
  }

  const value = {
    state,
    me,
    now,
    toasts,
    toast,
    dismissToast,
    login,
    logout,
    resetDemo,
    updateProfile,
    connectStarling,
    disconnectStarling,
    syncStarling,
    demoAddFunds,
    addFriend,
    removeFriend,
    createEvent,
    updateEvent,
    deleteEvent,
    cancelEvent,
    inviteToEvent,
    commit,
    decline,
    checkIn,
    startEventNow,
    endGracePeriod,
    checkTransportDelay,
    clearTransportDelay,
    simulateFriendTransport,
    markNotificationRead,
    markAllRead,
    clearNotifications,
    updateMemory,
    addPhotos,
    removePhoto,
    location,
    locationStatus,
    locationError,
    requestGps,
    simulateLocation,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

function heldCount(event) {
  return Object.values(event.members).filter((m) => m.status === 'committed').length
}
