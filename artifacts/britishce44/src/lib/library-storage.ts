/* Server-backed storage for the Digital Library system.
   Replaces the old IndexedDB-only approach so that when an admin/teacher
   uploads content, every allowed user can see, listen, download, or watch it. */

import { apiGet, apiPost, apiDelete } from './api'

export interface LibraryFile {
  id: number
  title: string
  roomId: string
  type: 'mp4' | 'jpg' | 'mp3' | 'pdf' | 'ppt' | 'flash'
  mimeType: string
  size: number
  fileUrl: string
  downloadUrl: string
  fileName: string
  uploadedAt: string
  uploadedBy: string
  description: string
  downloads: number
}

export interface LibraryUserPermission {
  userId: number
  access: 'allow' | 'ban'
  setBy: string
}

export interface RoomCard {
  id: number
  roomId: string
  title: string
  type: LibraryFile['type']
  fileId: number
  description: string
  backgroundColor: string
  createdAt: string
}

const ROOMS = [
  'video-room', 'books-room', 'ai-chatter', 'student-gallery',
  'announcements', 'games-room', 'ppt-competitions', 'cartoons-room',
  'worksheets', 'language-tester',
]

const CARD_COLORS = ['#2563eb', '#7c3aed', '#06b6d4', '#D4A017', '#ef4444', '#10b981', '#f97316', '#ec4899', '#6366f1', '#14b8a6']

/* ─── Files / Items ─── */

// Upload a file to the server (multipart). Called by admin/teacher.
export async function uploadLibraryFile(record: {
  title: string
  roomId: string
  type: LibraryFile['type']
  description: string
  uploadedBy: string
  file: File
}): Promise<number> {
  const formData = new FormData()
  formData.append('file', record.file)
  formData.append('roomId', record.roomId)
  formData.append('title', record.title)
  formData.append('description', record.description)
  formData.append('type', record.type)

  const token = localStorage.getItem('b44_token')
  const res = await fetch('/api/v1/library/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Upload failed')
  }
  const data = await res.json()
  return data.item.id
}

// Get all items in a room (server-backed — visible to all allowed users)
export async function getRoomFiles(roomId: string): Promise<LibraryFile[]> {
  try {
    const r = await apiGet<{ items: LibraryFile[] }>(`/library/rooms/${roomId}/items`)
    return r.items
  } catch {
    return []
  }
}

export async function getAllFiles(): Promise<LibraryFile[]> {
  // Aggregate across all rooms
  const all: LibraryFile[] = []
  for (const room of ROOMS) {
    const items = await getRoomFiles(room)
    all.push(...items)
  }
  return all
}

export async function getFileById(id: number): Promise<LibraryFile | undefined> {
  // Search all rooms (simple approach)
  const all = await getAllFiles()
  return all.find((f) => f.id === id)
}

export async function deleteLibraryFile(id: number): Promise<void> {
  try {
    await apiDelete(`/library/items/${id}`)
  } catch { /* ignore */ }
}

export async function incrementDownloads(id: number): Promise<void> {
  try {
    await apiPost(`/library/items/${id}/download`)
  } catch { /* ignore */ }
}

/* ─── Cards (now derived from items — one card per item) ─── */

export async function createCard(_record: Omit<RoomCard, 'id' | 'createdAt'>): Promise<string> {
  // Cards are now auto-created server-side during upload; this is a no-op
  return 'noop'
}

export async function getRoomCards(roomId: string): Promise<RoomCard[]> {
  const files = await getRoomFiles(roomId)
  return files.map((f, i) => ({
    id: f.id,
    roomId: f.roomId,
    title: f.title,
    type: f.type,
    fileId: f.id,
    description: f.description,
    backgroundColor: CARD_COLORS[i % CARD_COLORS.length],
    createdAt: f.uploadedAt,
  }))
}

export async function deleteCard(id: number): Promise<void> {
  // Deleting a card = deleting the item (they're unified now)
  await deleteLibraryFile(id)
}

/* ─── User Permissions (server-backed) ─── */

export async function setUserLibraryPermission(record: {
  userId: number
  access: 'allow' | 'ban'
}): Promise<void> {
  try {
    await apiPost('/library/permissions', { userId: record.userId, access: record.access })
  } catch { /* ignore */ }
}

export async function getAllLibraryUserPermissions(): Promise<LibraryUserPermission[]> {
  try {
    const r = await apiGet<{ permissions: LibraryUserPermission[] }>('/library/permissions')
    return r.permissions
  } catch {
    return []
  }
}

export async function getLibraryUserPermission(userId: number): Promise<LibraryUserPermission | undefined> {
  const perms = await getAllLibraryUserPermissions()
  return perms.find((p) => p.userId === userId)
}

export async function checkMyLibraryAccess(): Promise<'allow' | 'ban'> {
  try {
    const r = await apiGet<{ access: 'allow' | 'ban' }>('/library/my-access')
    return r.access
  } catch {
    return 'allow' // default allow if endpoint fails
  }
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
  mp4: { label: 'Video (MP4)', icon: '🎬', accept: 'video/mp4,video/webm', color: '#8b5cf6' },
  jpg: { label: 'Image (JPG)', icon: '🖼️', accept: 'image/jpeg,image/png,image/gif,image/webp', color: '#f59e0b' },
  mp3: { label: 'Audio (MP3)', icon: '🎵', accept: 'audio/mpeg,audio/wav,audio/ogg', color: '#10b981' },
  pdf: { label: 'Document (PDF)', icon: '📄', accept: 'application/pdf', color: '#ef4444' },
  ppt: { label: 'Presentation (PPT)', icon: '📊', accept: 'application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation', color: '#f97316' },
  flash: { label: 'Flash App', icon: '⚡', accept: '.swf,.html', color: '#06b6d4' },
}
