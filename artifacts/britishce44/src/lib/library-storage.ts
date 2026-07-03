/* IndexedDB-based storage for the Digital Library system */

const DB_NAME = 'britishce44_library'
const DB_VERSION = 3

export interface LibraryFile {
  id: string
  title: string
  roomId: string
  type: 'mp4' | 'jpg' | 'mp3' | 'pdf' | 'ppt' | 'flash'
  mimeType: string
  size: number
  data: Blob
  uploadedAt: string
  uploadedBy: string
  description: string
  downloads: number
}

export interface LibraryUserPermission {
  userId: number
  userName: string
  email: string
  role: string
  libraryAccess: 'allow' | 'ban'
  setBy: string
  setAt: string
}

export interface RoomCard {
  id: string
  roomId: string
  title: string
  type: LibraryFile['type']
  fileId: string
  backgroundColor: string
  createdAt: string
}

const ROOMS = [
  'video-room', 'books-room', 'ai-chatter', 'student-gallery',
  'announcements', 'games-room', 'ppt-competitions', 'cartoons-room',
  'worksheets', 'language-tester',
]

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('files')) {
        const store = db.createObjectStore('files', { keyPath: 'id' })
        store.createIndex('roomId', 'roomId', { unique: false })
        store.createIndex('type', 'type', { unique: false })
      }
      if (!db.objectStoreNames.contains('users')) {
        const store = db.createObjectStore('users', { keyPath: 'userId' })
        store.createIndex('libraryAccess', 'libraryAccess', { unique: false })
      }
      if (!db.objectStoreNames.contains('cards')) {
        const store = db.createObjectStore('cards', { keyPath: 'id' })
        store.createIndex('roomId', 'roomId', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/* ─── Files ─── */
export async function uploadLibraryFile(record: Omit<LibraryFile, 'id' | 'uploadedAt' | 'downloads'>): Promise<string> {
  const db = await openDB()
  const id = `lib-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const full: LibraryFile = { ...record, id, uploadedAt: new Date().toISOString(), downloads: 0 }
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite')
    tx.objectStore('files').add(full)
    tx.oncomplete = () => resolve(id)
    tx.onerror = () => reject(tx.error)
  })
}

export async function getRoomFiles(roomId: string): Promise<LibraryFile[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly')
    const req = tx.objectStore('files').index('roomId').getAll(roomId)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getAllFiles(): Promise<LibraryFile[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly')
    const req = tx.objectStore('files').getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getFileById(id: string): Promise<LibraryFile | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly')
    const req = tx.objectStore('files').get(id)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteLibraryFile(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite')
    tx.objectStore('files').delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function incrementDownloads(id: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction('files', 'readwrite')
  const store = tx.objectStore('files')
  const req = store.get(id)
  req.onsuccess = () => {
    const file = req.result
    if (file) { file.downloads++; store.put(file) }
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/* ─── Cards ─── */
export async function createCard(record: Omit<RoomCard, 'id' | 'createdAt'>): Promise<string> {
  const db = await openDB()
  const id = `card-${Date.now()}`
  const full: RoomCard = { ...record, id, createdAt: new Date().toISOString() }
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cards', 'readwrite')
    tx.objectStore('cards').add(full)
    tx.oncomplete = () => resolve(id)
    tx.onerror = () => reject(tx.error)
  })
}

export async function getRoomCards(roomId: string): Promise<RoomCard[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cards', 'readonly')
    const req = tx.objectStore('cards').index('roomId').getAll(roomId)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteCard(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cards', 'readwrite')
    tx.objectStore('cards').delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/* ─── User Permissions ─── */
export async function setUserLibraryPermission(record: LibraryUserPermission): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('users', 'readwrite')
    tx.objectStore('users').put(record)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getAllLibraryUserPermissions(): Promise<LibraryUserPermission[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('users', 'readonly')
    const req = tx.objectStore('users').getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getLibraryUserPermission(userId: number): Promise<LibraryUserPermission | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('users', 'readonly')
    const req = tx.objectStore('users').get(userId)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export { ROOMS }

export const ROOM_META: Record<string, { label: string; icon: string; gradient: string; desc: string }> = {
  'video-room': { label: 'Video Room', icon: '🎬', gradient: 'from-blue-600 to-purple-700', desc: 'Educational videos & lessons' },
  'books-room': { label: 'Books Room', icon: '📚', gradient: 'from-emerald-600 to-teal-700', desc: 'PDF books & reading materials' },
  'ai-chatter': { label: 'AI Chatter', icon: '🤖', gradient: 'from-violet-600 to-indigo-700', desc: 'AI speaking practice & chat' },
  'student-gallery': { label: 'Students Gallery', icon: '🖼️', gradient: 'from-pink-600 to-rose-700', desc: 'Student-created videos & photos' },
  'announcements': { label: 'Announcements', icon: '📢', gradient: 'from-amber-600 to-orange-700', desc: 'Center news, videos & apps' },
  'games-room': { label: 'Games Room', icon: '🎮', gradient: 'from-green-600 to-lime-700', desc: 'Interactive educational games' },
  'ppt-competitions': { label: 'PPT Competitions', icon: '🏆', gradient: 'from-yellow-600 to-amber-700', desc: 'Presentation & competition shows' },
  'cartoons-room': { label: 'Cartoons Room', icon: '🎨', gradient: 'from-sky-600 to-cyan-700', desc: 'Animated cartoons for learning' },
  'worksheets': { label: 'Worksheets', icon: '📝', gradient: 'from-indigo-600 to-blue-700', desc: 'Interactive worksheets & exercises' },
  'language-tester': { label: 'Language Tester', icon: '🌐', gradient: 'from-red-600 to-pink-700', desc: 'Language placement & testing' },
}

export const FILE_TYPE_CONFIG: Record<LibraryFile['type'], { label: string; icon: string; accept: string; color: string }> = {
  mp4: { label: 'Video (MP4)', icon: '🎬', accept: 'video/mp4', color: '#8b5cf6' },
  jpg: { label: 'Image (JPG)', icon: '🖼️', accept: 'image/jpeg,image/png,image/gif', color: '#f59e0b' },
  mp3: { label: 'Audio (MP3)', icon: '🎵', accept: 'audio/mpeg,audio/wav', color: '#10b981' },
  pdf: { label: 'Document (PDF)', icon: '📄', accept: 'application/pdf', color: '#ef4444' },
  ppt: { label: 'Presentation (PPT)', icon: '📊', accept: 'application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation', color: '#f97316' },
  flash: { label: 'Flash App', icon: '⚡', accept: '.swf,.html', color: '#06b6d4' },
}
