// Geolocation maths used for the check-in radius.

// Great-circle distance between two {lat, lng} points, in metres (haversine).
export function distanceMetres(a, b) {
  const R = 6371000
  const toRad = (x) => (x * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// A point `metres` north of `point` (used by the "Simulate" buttons).
export function offsetNorth(point, metres) {
  return { lat: point.lat + metres / 111320, lng: point.lng }
}

export function isWithinRadius(user, venue, radius) {
  if (!user || !venue) return false
  return distanceMetres(user, venue) <= radius
}
