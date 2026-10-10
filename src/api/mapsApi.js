// Public maps API: OpenStreetMap Nominatim (free, no API key).
// Usage policy: light, user-triggered searches only — perfect for a prototype.
// https://operations.osmfoundation.org/policies/nominatim/

const NOMINATIM = 'https://nominatim.openstreetmap.org'

export async function searchPlaces(query, signal) {
  const url = `${NOMINATIM}/search?format=jsonv2&limit=6&q=${encodeURIComponent(query)}`
  const res = await fetch(url, { signal, headers: { 'Accept-Language': 'en-GB' } })
  if (!res.ok) throw new Error('Place search failed')
  const data = await res.json()
  return data.map((place) => ({
    name: place.name || place.display_name.split(',')[0],
    address: place.display_name,
    lat: Number(place.lat),
    lng: Number(place.lon),
  }))
}

export async function reverseGeocode({ lat, lng }) {
  const url = `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
  const res = await fetch(url, { headers: { 'Accept-Language': 'en-GB' } })
  if (!res.ok) throw new Error('Reverse geocode failed')
  const place = await res.json()
  return {
    name: place.name || place.display_name?.split(',')[0] || 'Dropped pin',
    address: place.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    lat,
    lng,
  }
}

// Quick picks so the demo works even offline.
export const PRESET_VENUES = [
  {
    name: "Regent's Park Tennis Centre",
    address: "Regent's Park, London NW1",
    lat: 51.5268,
    lng: -0.1535,
  },
  {
    name: 'Hyde Park — The Serpentine',
    address: 'Hyde Park, London W2',
    lat: 51.5051,
    lng: -0.1659,
  },
  {
    name: 'Paddington Recreation Ground',
    address: 'Randolph Ave, London W9',
    lat: 51.5287,
    lng: -0.1912,
  },
  {
    name: 'Battersea Park',
    address: 'Battersea Park, London SW11',
    lat: 51.4791,
    lng: -0.1563,
  },
]
