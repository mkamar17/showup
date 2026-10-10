// Venue search using the public OpenStreetMap Nominatim API,
// plus quick picks, "use my location" and click-on-map.
import { useState } from 'react'
import { LocateFixed, MapPin, Search } from 'lucide-react'
import { PRESET_VENUES, reverseGeocode, searchPlaces } from '../api/mapsApi'
import MapView from './MapView'

export default function VenuePicker({ value, radius, onChange }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | error | empty
  const [message, setMessage] = useState('')

  async function runSearch() {
    if (!query.trim()) return
    setStatus('loading')
    try {
      const found = await searchPlaces(query.trim())
      setResults(found)
      setStatus(found.length ? 'idle' : 'empty')
    } catch {
      setStatus('error')
      setMessage('Search is unavailable right now — pick a quick venue or tap the map.')
    }
  }

  async function pickPoint(point) {
    onChange({ name: 'Dropped pin', address: `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`, ...point })
    try {
      onChange(await reverseGeocode(point))
    } catch {
      // keep the dropped pin
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setStatus('error')
      setMessage('Location is not supported in this browser.')
      return
    }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus('idle')
        pickPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        setStatus('error')
        setMessage('Could not get your location — allow location access or search instead.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="venue-picker">
      <div className="venue-picker__search">
        <div className="input-icon">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search a venue or address"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                runSearch()
              }
            }}
          />
        </div>
        <button type="button" className="btn btn--soft" onClick={runSearch} disabled={status === 'loading'}>
          {status === 'loading' ? 'Searching…' : 'Search'}
        </button>
        <button type="button" className="btn btn--soft" onClick={useMyLocation} title="Use my current location">
          <LocateFixed size={16} />
          <span className="hide-sm">Here</span>
        </button>
      </div>

      {status === 'error' && <p className="form-error">{message}</p>}
      {status === 'empty' && <p className="muted small">No places found — try a different search.</p>}

      {results.length > 0 && (
        <ul className="venue-picker__results">
          {results.map((r) => (
            <li key={`${r.lat}-${r.lng}`}>
              <button
                type="button"
                onClick={() => {
                  onChange(r)
                  setResults([])
                }}
              >
                <MapPin size={15} />
                <span>
                  <strong>{r.name}</strong>
                  <small>{r.address}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="chip-row">
        {PRESET_VENUES.map((v) => (
          <button
            key={v.name}
            type="button"
            className={`chip${value?.name === v.name ? ' is-active' : ''}`}
            onClick={() => onChange(v)}
          >
            {v.name}
          </button>
        ))}
      </div>

      {value ? (
        <p className="venue-picker__selected">
          <MapPin size={15} /> <strong>{value.name}</strong> <span className="muted">· {value.address}</span>
        </p>
      ) : (
        <p className="muted small">Pick a venue above or tap the map to drop a pin.</p>
      )}
      <MapView venue={value} radius={radius} height={200} onPick={pickPoint} />
    </div>
  )
}
