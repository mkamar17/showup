// Small formatting helpers. All money is stored in pence (integers).

export function formatMoney(pence, { sign = false } = {}) {
  const value = `£${(Math.abs(pence) / 100).toFixed(2)}`
  if (sign) {
    if (pence > 0) return `+${value}`
    if (pence < 0) return `−${value}`
    return value
  }
  return pence < 0 ? `−${value}` : value
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}

const pad = (n) => String(n).padStart(2, '0')

// yyyy-mm-dd in local time (for <input type="date">)
export function toDateInput(value) {
  const d = new Date(value)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// HH:MM in local time (for <input type="time">)
export function toTimeInput(value) {
  const d = new Date(value)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatDate(ms, options) {
  return new Date(ms).toLocaleDateString(
    'en-GB',
    options ?? { weekday: 'short', day: 'numeric', month: 'short' },
  )
}

export function formatTime(ms) {
  return new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(ms) {
  return `${formatDate(ms)} · ${formatTime(ms)}`
}

export function relativeTime(ms, now = Date.now()) {
  const diff = Math.round((now - ms) / 1000)
  if (diff < 45) return 'just now'
  const mins = Math.round(diff / 60)
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function timeUntil(ms, now = Date.now()) {
  let diff = Math.max(0, ms - now)
  const days = Math.floor(diff / 86400000)
  diff -= days * 86400000
  const hours = Math.floor(diff / 3600000)
  diff -= hours * 3600000
  const mins = Math.ceil(diff / 60000)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export function daysLeftLabel(ms, now = Date.now()) {
  const days = Math.ceil((ms - now) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return '1 day left'
  return `${days} days left`
}

export function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

export function formatDistance(metres) {
  if (metres < 1000) return `${Math.round(metres)}m`
  return `${(metres / 1000).toFixed(1)}km`
}

// Payment reference shown on Starling statements, e.g. ENG-FT-1610.
export function makeReference(title, ms) {
  const letters =
    title
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4) || 'EVT'
  const d = new Date(ms)
  return `ENG-${letters}-${pad(d.getDate())}${pad(d.getMonth() + 1)}`
}
