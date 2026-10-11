// Demo data the prototype starts with (and resets back to).
import { ME_ID } from './constants'
import { buildEventTimes, newMember } from './eventLogic'
import { computeSettlement } from './settlement'
import { toDateInput } from './format'

const DAY = 86400000
const MIN = 60000

function refDate(ms) {
  const d = new Date(ms)
  return `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}`
}

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
      color: '#7d2a3d',
      // Mock Starling main-account balance. `starling` is null until the user connects.
      balance: 41238,
      held: 0,
      starling: null,
      online: true,
      activity: 'Ready to play',
      lastActiveAt: now,
    },
    u_max: { id: 'u_max', username: 'maxstone', name: 'Max Stone', color: '#56704b', balance: 4867, held: 300, online: true, activity: 'Weekly Bicycle', lastActiveAt: now - 15 * MIN },
    u_grisha: { id: 'u_grisha', username: 'grishajack', name: 'Grisha Jack', color: '#c99020', balance: 4200, held: 300, online: false, activity: 'Slow Jogging', lastActiveAt: now - 22 * MIN },
    u_levi: { id: 'u_levi', username: 'levipattrick', name: 'Levi Pattrick', color: '#6e8a62', balance: 5166, held: 0, online: true, activity: 'Morning Swim', lastActiveAt: now - 33 * MIN },
    u_cody: { id: 'u_cody', username: 'codybryan', name: 'Cody Bryan', color: '#a8473f', balance: 5000, held: 0, online: true, activity: 'Quick Sprint', lastActiveAt: now - 41 * MIN },
    u_ella: { id: 'u_ella', username: 'ellamoss', name: 'Ella Moss', color: '#b98591', balance: 5000, held: 0, online: false, activity: 'Hiking', lastActiveAt: now - 70 * MIN },
    u_sam: { id: 'u_sam', username: 'samokafor', name: 'Sam Okafor', color: '#4f4945', balance: 5000, held: 0, online: true, activity: 'Gym session', lastActiveAt: now - 5 * MIN },
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

  // 3) Past: Saturday doubles, everyone made it, and nobody has added photos
  //    yet, so the app nudges you to start the memory.
  const doublesDate = toDateInput(new Date(now - 3 * DAY))
  const doublesTimes = buildEventTimes(doublesDate, '10:00', 10)
  const doubles = {
    id: 'evt_doubles',
    seriesId: 'evt_doubles',
    title: 'Saturday Doubles',
    activity: 'tennis',
    date: doublesDate,
    time: '10:00',
    ...doublesTimes,
    graceMinutes: 10,
    radius: 150,
    amount: 400,
    repeatWeekly: false,
    venue: { name: 'Regent’s Park Tennis Centre', address: 'York Bridge, London NW1', lat: 51.5246, lng: -0.1535 },
    adminId: 'u_levi',
    members: {
      u_levi: { ...newMember('committed'), checkedInAt: doublesTimes.startAt - 6 * MIN, checkInDistance: 18 },
      [ME_ID]: { ...newMember('committed'), checkedInAt: doublesTimes.startAt - 2 * MIN, checkInDistance: 35 },
      u_max: { ...newMember('committed'), checkedInAt: doublesTimes.startAt + 3 * MIN, checkInDistance: 52 },
      u_grisha: { ...newMember('committed'), checkedInAt: doublesTimes.startAt + 8 * MIN, checkInDistance: 44 },
    },
    settled: true,
    createdAt: now - 7 * DAY,
  }
  doubles.settlement = { ...computeSettlement(doubles), settledAt: doublesTimes.graceEndsAt }

  // Sample photos for the 5-a-side memory, shared by the three who came.
  // Image files are bundled illustrations (see photoStore SAMPLE_PHOTOS).
  const shot = (id, sample, uploadedBy, minutesAfter, width, height) => ({
    id,
    eventId: 'evt_5aside',
    uploadedBy,
    sample,
    width,
    height,
    createdAt: pastTimes.startAt + minutesAfter * MIN,
  })
  const photos = [
    shot('pho_1', 'floodlights', ME_ID, 4, 1200, 900),
    shot('pho_2', 'huddle', 'u_max', 9, 900, 1200),
    shot('pho_3', 'ball', 'u_levi', 30, 1200, 900),
    shot('pho_4', 'scoreboard', ME_ID, 72, 1200, 900),
    shot('pho_5', 'boots', 'u_levi', 80, 900, 1200),
    shot('pho_6', 'sunset', 'u_max', 95, 1200, 900),
  ]

  return {
    session: null,
    users,
    friends: ['u_max', 'u_grisha', 'u_levi'],
    events: [run, fiveASide, doubles],
    photos,
    notifications: [
      { id: 'ntf_0', text: 'Connect your Starling account so you can commit to events.', link: '/profile?tab=banking', kind: 'invite', read: false, time: now - 5 * MIN },
      { id: 'ntf_1', text: 'Max Stone invited you to Sunday Morning Run (£3.00 commitment).', link: '/events/evt_run', kind: 'invite', read: false, time: now - 2 * DAY },
      { id: 'ntf_2', text: 'You showed up to Thursday 5-a-side — £6.67 went back into your Starling account.', link: '/events/evt_5aside/settlement', kind: 'success', read: true, time: pastTimes.graceEndsAt },
      { id: 'ntf_4', text: 'Got photos from Saturday Doubles? Add them to the memory.', link: '/memories/evt_doubles', kind: 'info', read: false, time: doublesTimes.graceEndsAt },
      { id: 'ntf_3', text: 'Levi Pattrick accepted your friend request.', link: '/community', kind: 'info', read: true, time: now - 12 * DAY },
    ],
    // Starling activity Show up! has initiated (newest first).
    transactions: [
      { id: 'tx_5', type: 'refund', amount: 400, space: 'available', status: 'completed', label: 'Commitment returned · Saturday Doubles', route: 'Show up! Space → Main', reference: 'SU-SD-' + refDate(doublesTimes.startAt), eventId: 'evt_doubles', time: doublesTimes.graceEndsAt },
      { id: 'tx_4', type: 'hold', amount: -400, space: 'available', status: 'completed', label: 'Committed to Saturday Doubles', route: 'Main → Show up! Space', reference: 'SU-SD-' + refDate(doublesTimes.startAt), eventId: 'evt_doubles', time: now - 6 * DAY },
      { id: 'tx_3', type: 'payout', amount: 167, space: 'available', status: 'completed', label: 'Penalty share · Thursday 5-a-side', sub: 'from Grisha', route: 'Faster Payment → Main', reference: 'SU-T5-' + refDate(pastTimes.startAt), eventId: 'evt_5aside', time: pastTimes.graceEndsAt + MIN },
      { id: 'tx_2', type: 'refund', amount: 500, space: 'available', status: 'completed', label: 'Commitment returned · Thursday 5-a-side', route: 'Show up! Space → Main', reference: 'SU-T5-' + refDate(pastTimes.startAt), eventId: 'evt_5aside', time: pastTimes.graceEndsAt },
      { id: 'tx_1', type: 'hold', amount: -500, space: 'available', status: 'completed', label: 'Committed to Thursday 5-a-side', route: 'Main → Show up! Space', reference: 'SU-T5-' + refDate(pastTimes.startAt), eventId: 'evt_5aside', time: now - 13 * DAY },
    ],
    memories: [
      {
        id: 'mem_1',
        eventId: 'evt_5aside',
        title: 'Thursday 5-a-side',
        activity: 'football',
        date: pastTimes.startAt,
        venueName: 'Paddington Recreation Ground',
        committed: [ME_ID, 'u_max', 'u_levi', 'u_grisha'],
        attendees: [ME_ID, 'u_max', 'u_levi'],
        noShows: ['u_grisha'],
        myResult: 167,
        note: 'Close one — 7-6 at full time. Grisha owes us a rematch.',
        createdAt: pastTimes.graceEndsAt,
      },
      {
        id: 'mem_2',
        eventId: 'evt_doubles',
        title: 'Saturday Doubles',
        activity: 'tennis',
        date: doublesTimes.startAt,
        venueName: 'Regent’s Park Tennis Centre',
        committed: [ME_ID, 'u_levi', 'u_max', 'u_grisha'],
        attendees: [ME_ID, 'u_levi', 'u_max', 'u_grisha'],
        noShows: [],
        myResult: 0,
        note: '',
        createdAt: doublesTimes.graceEndsAt,
      },
    ],
  }
}
