// Leaflet map (OpenStreetMap tiles, no API key) showing the venue,
// its check-in radius and — if known — the user's position.
import { useEffect } from 'react'
import { Circle, CircleMarker, MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const venueIcon = L.divIcon({
  className: 'venue-pin',
  html: '<span></span>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
})

function FitView({ vLat, vLng, uLat, uLng, radius }) {
  const map = useMap()

  // Leaflet needs a size refresh when it mounts inside modals/cards.
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200)
    return () => clearTimeout(t)
  }, [map])

  useEffect(() => {
    if (vLat == null) return
    if (uLat != null) {
      map.fitBounds(L.latLngBounds([vLat, vLng], [uLat, uLng]).pad(0.35), { maxZoom: 17 })
    } else {
      map.setView([vLat, vLng], radius > 300 ? 15 : 16)
    }
  }, [map, vLat, vLng, uLat, uLng, radius])
  return null
}

function ClickToPick({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

export default function MapView({ venue, radius = 150, user, height = 260, onPick, inRadius }) {
  const center = venue ? [venue.lat, venue.lng] : [51.5155, -0.1545]
  return (
    <div className="map-view" style={{ height }}>
      <MapContainer center={center} zoom={15} scrollWheelZoom={false} attributionControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitView vLat={venue?.lat} vLng={venue?.lng} uLat={user?.lat} uLng={user?.lng} radius={radius} />
        {onPick && <ClickToPick onPick={onPick} />}
        {venue && (
          <>
            <Circle
              center={[venue.lat, venue.lng]}
              radius={radius}
              pathOptions={{ color: '#6c5dd3', fillColor: '#6c5dd3', fillOpacity: 0.12, weight: 2, dashArray: '6 6' }}
            />
            <Marker position={[venue.lat, venue.lng]} icon={venueIcon}>
              <Tooltip direction="top" offset={[0, -28]}>
                {venue.name}
              </Tooltip>
            </Marker>
          </>
        )}
        {user && (
          <CircleMarker
            center={[user.lat, user.lng]}
            radius={9}
            pathOptions={{
              color: '#fff',
              weight: 3,
              fillColor: inRadius ? '#3dbe6e' : '#f178b6',
              fillOpacity: 1,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              You {user.source === 'simulated' ? '(simulated)' : ''}
            </Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  )
}
