// Prototype photo storage. Image files live in IndexedDB (localStorage is far
// too small for them); app state only keeps each photo's metadata:
//   { id, eventId, uploadedBy, createdAt, width, height, sample? }
// A real backend would swap this file for object storage (S3, Cloudinary…)
// and keep the same metadata shape in the database.
import ball from '../assets/sample-memories/ball.svg'
import boots from '../assets/sample-memories/boots.svg'
import floodlights from '../assets/sample-memories/floodlights.svg'
import huddle from '../assets/sample-memories/huddle.svg'
import scoreboard from '../assets/sample-memories/scoreboard.svg'
import sunset from '../assets/sample-memories/sunset.svg'

// Bundled demo images, referenced from seed data by key (asset URLs change
// between builds, so they are never stored).
export const SAMPLE_PHOTOS = { ball, boots, floodlights, huddle, scoreboard, sunset }

export const MAX_FILE_BYTES = 20 * 1024 * 1024
export const MAX_PHOTOS_PER_UPLOAD = 20
const FULL_EDGE = 1600
const THUMB_EDGE = 480

const DB_NAME = 'showup-photos'
const STORE = 'photos'

let dbPromise = null

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('This browser can’t store photos.'))
        return
      }
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(STORE)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    dbPromise.catch(() => {
      dbPromise = null
    })
  }
  return dbPromise
}

async function run(mode, fn) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(req?.result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error ?? new Error('Storage is full.'))
  })
}

export const saveImages = (id, images) => run('readwrite', (store) => store.put(images, id))
export const loadImages = (id) => run('readonly', (store) => store.get(id))
export const deleteImages = (id) => run('readwrite', (store) => store.delete(id))
export const clearImages = () => run('readwrite', (store) => store.clear())

// Checks a picked file before any work is done on it. Returns an error message or ''.
export function validateFile(file) {
  if (!file.type.startsWith('image/')) return 'Not a photo'
  if (file.size > MAX_FILE_BYTES) return 'Too large (max 20 MB)'
  return ''
}

async function decode(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file)
    } catch {
      // fall through to <img>, which some formats decode better
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

function toJpeg(source, width, height, edge, quality) {
  const scale = Math.min(1, edge / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode'))), 'image/jpeg', quality),
  )
}

// Shrinks a photo to a display copy and a thumbnail (both JPEG).
export async function processImage(file) {
  let source
  try {
    source = await decode(file)
  } catch {
    throw new Error('Couldn’t read this photo — try a JPG or PNG')
  }
  const width = source.width
  const height = source.height
  const [full, thumb] = await Promise.all([
    toJpeg(source, width, height, FULL_EDGE, 0.85),
    toJpeg(source, width, height, THUMB_EDGE, 0.75),
  ])
  source.close?.()
  return { full, thumb, width, height }
}
