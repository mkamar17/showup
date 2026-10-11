// Full-size photo view for a memory: who added it and when, with
// previous/next and (for the uploader or the event admin) remove.
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react'
import { useApp } from '../api/useApp'
import { ME_ID } from '../api/constants'
import { formatDateTime } from '../api/format'
import Avatar from './Avatar'
import PhotoImg from './PhotoImg'
import ConfirmModal from './ConfirmModal'

export default function PhotoViewer({ photos, index, onIndex, onClose, canRemove }) {
  const { state, removePhoto } = useApp()
  const [confirming, setConfirming] = useState(false)
  const photo = photos[index]
  const uploader = state.users[photo?.uploadedBy]
  const go = (step) => onIndex((index + step + photos.length) % photos.length)

  useEffect(() => {
    const onKey = (e) => {
      if (confirming) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onIndex((i) => (i - 1 + photos.length) % photos.length)
      if (e.key === 'ArrowRight') onIndex((i) => (i + 1) % photos.length)
    }
    document.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
    }
  }, [confirming, onClose, onIndex, photos.length])

  if (!photo) return null

  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label="Photo" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <header className="viewer__bar">
        <span className="viewer__who">
          <Avatar user={uploader} size={34} />
          <span>
            <strong>Added by {photo.uploadedBy === ME_ID ? 'you' : (uploader?.name ?? 'someone')}</strong>
            <small>
              {formatDateTime(photo.createdAt)}
              {photo.sample && ' · sample image'}
            </small>
          </span>
        </span>
        <span className="viewer__count">
          {index + 1} / {photos.length}
        </span>
        <span className="viewer__actions">
          {canRemove(photo) && (
            <button type="button" className="viewer__btn" onClick={() => setConfirming(true)} aria-label="Remove photo" title="Remove photo">
              <Trash2 size={18} />
            </button>
          )}
          <button type="button" className="viewer__btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </span>
      </header>

      <div className="viewer__stage" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        {photos.length > 1 && (
          <button type="button" className="viewer__nav viewer__nav--prev" onClick={() => go(-1)} aria-label="Previous photo">
            <ChevronLeft size={26} />
          </button>
        )}
        <PhotoImg key={photo.id} photo={photo} size="full" alt={`Photo added by ${uploader?.name ?? 'a member'}`} className="viewer__img" />
        {photos.length > 1 && (
          <button type="button" className="viewer__nav viewer__nav--next" onClick={() => go(1)} aria-label="Next photo">
            <ChevronRight size={26} />
          </button>
        )}
      </div>

      {confirming && (
        <ConfirmModal
          title="Remove this photo?"
          message="It’s removed from the memory for everyone."
          confirmLabel="Remove"
          danger
          onConfirm={() => {
            removePhoto(photo.id)
            if (photos.length === 1) onClose()
            else onIndex(Math.min(index, photos.length - 2))
          }}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  )
}
