// Shared constants for the Engine prototype.

export const ME_ID = 'u_me'

export const STORAGE_KEY = 'engine-prototype-state-v2'

// Mock Starling: how long a Faster Payment shows as "Pending" before "Completed".
export const PAYMENT_SETTLE_MS = 6000

// What Engine asks permission for when connecting Starling (OAuth consent).
export const STARLING_PERMISSIONS = [
  { title: 'See your balance', detail: 'To check you can cover a commitment' },
  { title: 'Create an “Engine Commitments” Space', detail: 'Where held money sits' },
  { title: 'Move money in and out of that Space', detail: 'Only when you approve a commitment' },
  { title: 'Pay attendees if you miss an event', detail: 'Only the amount you committed' },
]

// Check-in opens this many minutes before an event starts.
export const CHECKIN_EARLY_MINUTES = 30

// "Start event now (demo)" runs the grace period this many times faster.
// 10 min grace / 20 = 30 seconds.
export const DEMO_GRACE_SPEED = 20

export const GRACE_OPTIONS = [10, 12, 15]

export const RADIUS_MIN = 50
export const RADIUS_MAX = 500

export const ACTIVITIES = [
  { value: 'tennis', label: 'Tennis' },
  { value: 'running', label: 'Running' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'football', label: 'Football' },
  { value: 'gym', label: 'Gym' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'hiking', label: 'Hiking' },
  { value: 'other', label: 'Other' },
]

// Mock history for the dashboard "Overview" chart (events attended).
export const MONTHLY_ATTENDANCE = [
  { label: 'Jan', value: 2 },
  { label: 'Feb', value: 4 },
  { label: 'Mar', value: 3 },
  { label: 'Apr', value: 7 },
  { label: 'May', value: 5 },
  { label: 'Jun', value: 6 },
  { label: 'Jul', value: 4 },
  { label: 'Aug', value: 8 },
  { label: 'Sep', value: 6 },
  { label: 'Oct', value: 7 },
]

export const WEEKLY_ATTENDANCE = [
  { label: 'W1', value: 1 },
  { label: 'W2', value: 2 },
  { label: 'W3', value: 1 },
  { label: 'W4', value: 3 },
  { label: 'W5', value: 2 },
  { label: 'W6', value: 2 },
  { label: 'W7', value: 1 },
  { label: 'W8', value: 3 },
]
