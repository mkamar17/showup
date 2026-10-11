// Photo previews for event memories: a compact strip for cards, and the full
// grid (with who added each photo) that opens the viewer.
import { useState } from 'react'
import { useApp } from '../api/useApp'
import { ME_ID } from '../api/constants'
import Avatar from './Avatar'
import PhotoImg from './PhotoImg'
import PhotoViewer from './PhotoViewer'
import '../styles/photos.css'

// `mosaic` makes the first photo the cover (memory cards); `strip` is a row.
export function PhotoStrip({ photos, max = 4, variant = 'strip' }) {
  const shown = photos.slice(0, max)
  const extra = photos.length - shown.length
  return (
    <div className={`photo-strip photo-strip--${variant}`} data-count={shown.length} style={{ '--strip-count': shown.length }}>
      {shown.map((p, i) => (
        <span key={p.id} className="photo-strip__cell">
          <PhotoImg photo={p} />
          {extra > 0 && i === shown.length - 1 && <span className="photo-strip__more">+{extra}</span>}
        </span>
      ))}
    </div>
  )
}

export function PhotoGrid({ photos, adminId }) {
  const { state } = useApp()
  const [open, setOpen] = useState(null)
  const canRemove = (p) => p.uploadedBy === ME_ID || adminId === ME_ID

  return (
    <>
      <ul className="photo-grid">
        {photos.map((p, i) => {
          const by = state.users[p.uploadedBy]
          return (
            <li key={p.id}>
              <button type="button" className="photo-grid__item" onClick={() => setOpen(i)} aria-label={`Open photo added by ${by?.name ?? 'a member'}`}>
                <PhotoImg photo={p} />
                <span className="photo-grid__by">
                  <Avatar user={by} size={24} title={`Added by ${p.uploadedBy === ME_ID ? 'you' : by?.name}`} />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {open !== null && photos[open] && (
        <PhotoViewer photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} canRemove={canRemove} />
      )}
    </>
  )
}
