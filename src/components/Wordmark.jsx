// The "show up!" wordmark: script lettering with a push-pin as the "!".
export function PinIcon({ size = '1em', className = '' }) {
  return (
    <svg className={`pin-icon ${className}`} viewBox="0 0 24 56" width={size} height={size} aria-hidden="true" style={{ height: size, width: 'auto' }}>
      <rect x="10.6" y="20" width="2.8" height="28" rx="1.2" fill="currentColor" />
      <path d="M10.6 46 L12 55 L13.4 46 Z" fill="currentColor" />
      <circle cx="12" cy="12" r="11" fill="#b53630" />
      <path d="M1.4 10.5 A11 11 0 0 1 22.6 10.5 A11 9.2 0 0 1 1.4 10.5 Z" fill="#d64541" />
      <ellipse cx="8.2" cy="5.6" rx="3.4" ry="1.8" transform="rotate(-28 8.2 5.6)" fill="#fff" fillOpacity="0.45" />
    </svg>
  )
}

export default function Wordmark({ size = 32, light = false }) {
  return (
    <span className={`wordmark${light ? ' wordmark--light' : ''}`} style={{ fontSize: size }} aria-label="show up!">
      show up
      <PinIcon size="0.95em" className="wordmark__pin" />
    </span>
  )
}
