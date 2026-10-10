// Demo data the prototype starts with (and resets back to).
import { ME_ID } from './constants'
import { buildEventTimes, newMember } from './eventLogic'
import { computeSettlement } from './settlement'
import { toDateInput } from './format'

const DAY = 86400000
const MIN = 60000

function nextWeekday(weekday, hour, minute) {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  const diff = (weekday - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + diff)
  return d
}

export function createSeedState() {
  const now = Date.now()

  const users = {
    [ME_ID]: {
      id: ME_ID,
      username: 'demo',
      name: 'Demo User',
      email: '',
      bio: '',
      color: '#6c5dd3',
      balance: 5167,
      held: 0,
      bank: null,
      online: true,
      activity: 'Ready to play',
      lastActiveAt: now,
    },
    u_max: { id: 'u_max', username: 'maxstone', name: 'Max Stone', color: '#4cb3e6', balance: 4867, held: 300, online: true, activity: 'Weekly Bicycle', lastActiveAt: now - 15 * MIN },
    u_grisha: { id: 'u_grisha', username: 'grishajack', name: 'Grisha Jack', color: '#e39b4b', balance: 4200, held: 300, online: false, activity: 'Slow Jogging', lastActiveAt: now - 22 * MIN },
    u_levi: { id: 'u_levi', username: 'levipattrick', name: 'Levi Pattrick', color: '#3dbe6e', balance: 5166, held: 0, online: true, activity: 'Morning Swim', lastActiveAt: now - 33 * MIN },
    u_cody: { id: 'u_cody', username: 'codybryan', name: 'Cody Bryan', color: '#e2525c', balance: 5000, held: 0, online: true, activity: 'Quick Sprint', lastActiveAt: now - 41 * MIN },
    u_ella: { id: 'u_ella', username: 'ellamoss', name: 'Ella Moss', color: '#f178b6', balance: 5000, held: 0, online: false, activity: 'Hiking', lastActiveAt: now - 70 * MIN },
    u_sam: { id: 'u_sam', username: 'samokafor', name: 'Sam Okafor', color: '#8b7ff0', balance: 5000, held: 0, online: true, activity: 'Gym session', lastActiveAt: now - 5 * MIN },
  }

  // 1) Upcoming: Max invited you to a weekly run.
  const sunday = nextWeekday(0, 9, 0)
  const runDate = toDateInput(sunday)
  const run = {
    id: 'evt_run',
    seriesId: 'evt_run',
    title: 'Sunday Morning Run',
    activity: 'running',
    date: runDate,
    time: '09:00',
    ...buildEventTimes(runDate, '09:00', 15),
    graceMinutes: 15,
    radius: 200,
    amount: 300,
    repeatWeekly: true,
    venue: { name: 'Hyde Park — The Serpentine', address: 'Hyde Park, London W2', lat: 51.5051, lng: -0.1659 },
    adminId: 'u_max',
    members: {
      u_max: { ...newMember('committed'), committedAt: now - 2 * DAY },
      u_grisha: { ...newMember('committed'), committedAt: now - DAY },
      [ME_ID]: newMember('invited'),
    },
    settled: false,
    settlement: null,
    demoFast: false,
    createdAt: now - 2 * DAY,
  }

  // 2) Past: a settled 5-a-side so the settlement + memory screens have data.
  const past = new Date(now - 9 * DAY)
  const pastDate = toDateInput(past)
  const pastTimes = buildEventTimes(pastDate, '19:00', 10)
  const fiveASide = {
    id: 'evt_5aside',
    seriesId: 'evt_5aside',
    title: 'Thursday 5-a-side',
    activity: 'football',
    date: pastDate,
    time: '19:00',
    ...pastTimes,
    graceMinutes: 10,
    radius: 150,
    amount: 500,
    repeatWeekly: false,
    venue: { name: 'Paddington Recreation Ground', address: 'Randolph Ave, London W9', lat: 51.5287, lng: -0.1912 },
    adminId: ME_ID,
    members: {
      [ME_ID]: { ...newMember('committed'), checkedInAt: pastTimes.startAt - 4 * MIN, checkInDistance: 24 },
      u_max: { ...newMember('committed'), checkedInAt: pastTimes.startAt + 2 * MIN, checkInDistance: 61 },
      u_levi: { ...newMember('committed'), checkedInAt: pastTimes.startAt + 6 * MIN, checkInDistance: 40 },
      u_grisha: newMember('committed'),
    },
    settled: true,
    createdAt: now - 14 * DAY,
  }
  fiveASide.settlement = { ...computeSettlement(fiveASide), settledAt: pastTimes.graceEndsAt }

  return {
    session: null,
    users,
    friends: ['u_max', 'u_grisha', 'u_levi'],
    events: [run, fiveASide],
    notifications: [
      { id: 'ntf_1', text: 'Max Stone invited you to Sunday Morning Run (£3.00 commitment).', link: '/events/evt_run', kind: 'invite', read: false, time: now - 2 * DAY },
      { id: 'ntf_2', text: 'You showed up to Thursday 5-a-side — £6.67 is back in your wallet.', link: '/events/evt_5aside/settlement', kind: 'success', read: true, time: pastTimes.graceEndsAt },
      { id: 'ntf_3', text: 'Levi Pattrick accepted your friend request.', link: '/community', kind: 'info', read: true, time: now - 12 * DAY },
    ],
    transactions: [
      { id: 'tx_4', type: 'payout', amount: 167, space: 'available', label: 'Share of no-show penalties · Thursday 5-a-side', eventId: 'evt_5aside', time: pastTimes.graceEndsAt },
      { id: 'tx_3', type: 'refund', amount: 500, space: 'available', label: 'Commitment returned · Thursday 5-a-side', eventId: 'evt_5aside', time: pastTimes.graceEndsAt },
      { id: 'tx_2', type: 'hold', amount: -500, space: 'available', label: 'Committed to Thursday 5-a-side', eventId: 'evt_5aside', time: now - 13 * DAY },
      { id: 'tx_1', type: 'topup', amount: 5000, space: 'available', label: 'Welcome top-up (mock)', time: now - 20 * DAY },
    ],
    memories: [
      {
        id: 'mem_1',
        eventId: 'evt_5aside',
        title: 'Thursday 5-a-side',
        activity: 'football',
        date: pastTimes.startAt,
        venueName: 'Paddington Recreation Ground',
        attendees: [ME_ID, 'u_max', 'u_levi'],
        noShows: ['u_grisha'],
        myResult: 167,
        note: 'Close one — 7-6 at full time. Grisha owes us a rematch.',
        createdAt: pastTimes.graceEndsAt,
      },
    ],
  }
}
