// Shared constants for the Show up! prototype.

export const ME_ID = 'u_me'

// v4: adds `photos` and the Saturday Doubles demo event.
export const STORAGE_KEY = 'engine-prototype-state-v4'

// Mock Starling: how long a Faster Payment shows as "Pending" before "Completed".
export const PAYMENT_SETTLE_MS = 6000

// What Show up! asks permission for when connecting Starling (OAuth consent).
export const STARLING_PERMISSIONS = [
  { title: 'See your balance', detail: 'To check you can cover a commitment' },
  { title: 'Create an “Show up! Commitments” Space', detail: 'Where held money sits' },
  { title: 'Move money in and out of that Space', detail: 'Only when you approve a commitment' },
  { title: 'Pay attendees if you miss an event', detail: 'Only the amount you committed' },
]

// Check-in opens this many minutes before an event starts.
export const CHECKIN_EARLY_MINUTES = 30

// "Start event now (demo)" runs the grace period this many times faster.
// 10 min grace / 20 = 30 seconds.
export const DEMO_GRACE_SPEED = 20

export const GRACE_OPTIONS = [10, 12, 15, 30, 60]

export const RADIUS_MIN = 50
export const RADIUS_MAX = 500

// Event types: sports and social plans, A–Z, with "Other" always last.
export const ACTIVITIES = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'brunch', label: 'Brunch' },
  { value: 'cinema', label: 'Cinema' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'concert', label: 'Concert' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'drinks', label: 'Drinks' },
  { value: 'football', label: 'Football' },
  { value: 'gaming', label: 'Game night' },
  { value: 'gym', label: 'Gym' },
  { value: 'hiking', label: 'Hiking' },
  { value: 'museum', label: 'Museum or gallery' },
  { value: 'party', label: 'Party' },
  { value: 'picnic', label: 'Picnic' },
  { value: 'running', label: 'Running' },
  { value: 'study', label: 'Study session' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'trip', label: 'Trip' },
  { value: 'volunteering', label: 'Volunteering' },
  { value: 'yoga', label: 'Yoga' },
]
  .sort((a, b) => a.label.localeCompare(b.label))
  .concat({ value: 'other', label: 'Other' })
