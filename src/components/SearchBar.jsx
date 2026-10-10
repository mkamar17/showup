import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useApp } from '../api/useApp'
import { useClickOutside } from '../api/hooks'
import { formatDateTime } from '../api/format'
import { ME_ID } from '../api/constants'
import ActivityIcon from './ActivityIcon'

export default function SearchBar() {
  const { state } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(ref, close, open)

  const q = query.trim().toLowerCase()
  const results = q
    ? state.events
        .filter((e) => e.members[ME_ID] || e.adminId === ME_ID)
        .filter((e) => e.title.toLowerCase().includes(q) || e.venue.name.toLowerCase().includes(q))
        .slice(0, 6)
    : []

  const go = (id) => {
    setQuery('')
    setOpen(false)
    navigate(`/events/${id}`)
  }

  return (
    <div className="searchbar" ref={ref}>
      <Search size={18} />
      <input
        type="search"
        placeholder="Search events"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Enter' && results[0] && go(results[0].id)}
        aria-label="Search events"
      />
      {open && q && (
        <div className="dropdown searchbar__results">
          {results.length === 0 && <p className="dropdown__empty">No events match “{query}”</p>}
          {results.map((e) => (
            <button key={e.id} type="button" className="dropdown__item" onClick={() => go(e.id)}>
              <span className="dropdown__icon">
                <ActivityIcon activity={e.activity} size={16} />
              </span>
              <span>
                <strong>{e.title}</strong>
                <small>{formatDateTime(e.startAt)}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
