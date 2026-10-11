// "Add photos" for an event's memory. The event supplies all the context
// (which memory, date, people), so the only thing to do is pick photos.
import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Check, ImagePlus, Loader2, X } from 'lucide-react'
import { useApp } from '../api/useApp'
import { uid } from '../api/format'
import { MAX_PHOTOS_PER_UPLOAD, processImage, saveImages, validateFile } from '../api/photoStore'
import Modal from './Modal'
import '../styles/photos.css'

export default function AddPhotosModal({ eventId, title, onClose }) {
  const { addPhotos, toast } = useApp()
  const inputRef = useRef(null)
  const [items, setItems] = useState([]) // { key, file, preview, status: ready|uploading|done|failed, error }
  const [busy, setBusy] = useState(false)
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  // Release preview URLs when the modal closes.
  useEffect(() => () => itemsRef.current.forEach((i) => i.preview && URL.revokeObjectURL(i.preview)), [])

  const pick = (fileList) => {
    const files = [...fileList]
    const room = MAX_PHOTOS_PER_UPLOAD - items.length
    if (files.length > room) toast(`You can add up to ${MAX_PHOTOS_PER_UPLOAD} photos at a time`)
    const added = files.slice(0, Math.max(0, room)).map((file) => {
      const error = validateFile(file)
      return { key: uid('pick'), file, preview: error ? null : URL.createObjectURL(file), status: error ? 'failed' : 'ready', error, invalid: !!error }
    })
    setItems((list) => [...list, ...added])
  }

  const remove = (key) =>
    setItems((list) => {
      const item = list.find((i) => i.key === key)
      if (item?.preview) URL.revokeObjectURL(item.preview)
      return list.filter((i) => i.key !== key)
    })

  const patch = (key, fields) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...fields } : i)))

  const todo = items.filter((i) => !i.invalid && i.status !== 'done')
  const failed = items.filter((i) => i.status === 'failed' && !i.invalid)
  const done = items.filter((i) => i.status === 'done').length
  const skipped = items.filter((i) => i.invalid).length
  const valid = items.length - skipped

  async function upload() {
    setBusy(true)
    const saved = []
    for (const item of todo) {
      patch(item.key, { status: 'uploading', error: '' })
      try {
        const { full, thumb, width, height } = await processImage(item.file)
        const id = uid('pho')
        await saveImages(id, { full, thumb })
        saved.push({ id, width, height })
        patch(item.key, { status: 'done' })
      } catch (err) {
        const full = err?.name === 'QuotaExceededError' || /full/i.test(err?.message ?? '')
        patch(item.key, { status: 'failed', error: full ? 'Storage full on this device' : err?.message || 'Upload failed' })
      }
    }
    setBusy(false)

    if (saved.length) {
      addPhotos(eventId, saved)
      toast(`${saved.length} photo${saved.length === 1 ? '' : 's'} added to ${title}`, 'success')
    }
    // Close unless something needs a retry (skipped non-photos don't).
    if (saved.length === todo.length) onClose()
  }

  const n = todo.length
  const photosLabel = `${n} photo${n === 1 ? '' : 's'}`
  const action = busy
    ? `Adding ${Math.min(done + 1, valid)} of ${valid}…`
    : n === 0
      ? 'Add photos'
      : failed.length === n
        ? `Retry ${photosLabel}`
        : `Add ${photosLabel}`

  return (
    <Modal
      title={`Add to ${title}`}
      onClose={busy ? () => {} : onClose}
      wide
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            {done && !todo.length ? 'Done' : 'Cancel'}
          </button>
          <button type="button" className="btn btn--primary" onClick={upload} disabled={busy || todo.length === 0}>
            {busy && <Loader2 size={16} className="spin" />} {action}
          </button>
        </>
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          pick(e.target.files)
          e.target.value = ''
        }}
      />

      {items.length === 0 ? (
        <button type="button" className="photo-drop" onClick={() => inputRef.current?.click()}>
          <ImagePlus size={30} />
          <strong>Choose photos</strong>
          <span className="muted small">On your phone you can take one or pick from your gallery. They’re added to this event for everyone who joined.</span>
        </button>
      ) : (
        <>
          <div className="photo-picks__head">
            <strong>
              {valid} photo{valid === 1 ? '' : 's'}
              {skipped ? ` · ${skipped} skipped` : ''}
              {done ? ` · ${done} added` : ''}
            </strong>
            {!busy && items.length < MAX_PHOTOS_PER_UPLOAD && (
              <button type="button" className="link-btn" onClick={() => inputRef.current?.click()}>
                <ImagePlus size={15} /> Add more
              </button>
            )}
          </div>
          <ul className="photo-picks">
            {items.map((i) => (
              <li key={i.key} className={`photo-pick photo-pick--${i.status}`}>
                {i.preview ? <img src={i.preview} alt={i.file.name} /> : <span className="photo-pick__name">{i.file.name}</span>}
                {i.status === 'uploading' && (
                  <span className="photo-pick__state">
                    <Loader2 size={20} className="spin" />
                  </span>
                )}
                {i.status === 'done' && (
                  <span className="photo-pick__state photo-pick__state--done">
                    <Check size={20} />
                  </span>
                )}
                {i.status === 'failed' && (
                  <span className="photo-pick__error">
                    <AlertCircle size={14} /> {i.error}
                  </span>
                )}
                {!busy && i.status !== 'done' && (
                  <button type="button" className="photo-pick__remove" onClick={() => remove(i.key)} aria-label={`Remove ${i.file.name}`}>
                    <X size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="muted small photo-drop__note">Prototype — photos are stored on this device only.</p>
    </Modal>
  )
}
