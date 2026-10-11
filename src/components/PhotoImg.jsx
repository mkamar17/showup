// Renders a memory photo from wherever it lives: a bundled sample image,
// or a blob in this device's IndexedDB (thumbnail or display size).
import { useEffect, useState } from 'react'
import { ImageOff } from 'lucide-react'
import { SAMPLE_PHOTOS, loadImages } from '../api/photoStore'

export default function PhotoImg({ photo, size = 'thumb', alt = '', className = '' }) {
  const sample = photo.sample ? SAMPLE_PHOTOS[photo.sample] : null
  const [loaded, setLoaded] = useState({ id: null, url: null, missing: false })

  useEffect(() => {
    if (sample) return undefined
    let url = null
    let cancelled = false
    loadImages(photo.id)
      .then((images) => {
        if (cancelled) return
        const blob = images?.[size]
        if (!blob) {
          setLoaded({ id: photo.id, url: null, missing: true })
          return
        }
        url = URL.createObjectURL(blob)
        setLoaded({ id: photo.id, url, missing: false })
      })
      .catch(() => !cancelled && setLoaded({ id: photo.id, url: null, missing: true }))
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [photo.id, sample, size])

  const src = sample ?? (loaded.id === photo.id ? loaded.url : null)
  const missing = !sample && loaded.id === photo.id && loaded.missing

  if (missing) {
    return (
      <span className={`photo-img photo-img--missing ${className}`} title="This photo is stored on another device">
        <ImageOff size={20} />
      </span>
    )
  }
  if (!src) return <span className={`photo-img photo-img--loading ${className}`} aria-hidden="true" />
  return <img className={`photo-img ${className}`} src={src} alt={alt} loading="lazy" decoding="async" />
}
