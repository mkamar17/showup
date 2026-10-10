import { initials } from '../api/format'

export default function Avatar({ user, size = 40, ring = false, title }) {
  if (!user) return null
  return (
    <span
      className={`avatar${ring ? ' avatar--ring' : ''}`}
      style={{ width: size, height: size, background: user.color, fontSize: size * 0.38 }}
      title={title ?? user.name}
      aria-label={user.name}
    >
      {initials(user.name)}
    </span>
  )
}

export function AvatarStack({ users, max = 4, size = 30 }) {
  const shown = users.slice(0, max)
  const extra = users.length - shown.length
  return (
    <span className="avatar-stack">
      {shown.map((u) => (
        <Avatar key={u.id} user={u} size={size} ring />
      ))}
      {extra > 0 && (
        <span className="avatar avatar--ring avatar--more" style={{ width: size, height: size, fontSize: size * 0.36 }}>
          +{extra}
        </span>
      )}
    </span>
  )
}
