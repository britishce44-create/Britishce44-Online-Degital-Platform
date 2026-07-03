/* IndexedDB-based student records: homework, videos, mailbox documents */

const DB_NAME = 'britishce44_student_records'
const DB_VERSION = 2

interface FileRecord {
  id: string
  name: string
  type: 'homework' | 'video' | 'document'
  mimeType: string
  size: number
  studentId: number
  studentName: string
  title: string
  description: string
  uploadedAt: string
  data: Blob
  folder: string
  teacherComment?: string
  graded?: boolean
  grade?: number
}

interface StudentActivityEntry {
  id: string
  studentId: number
  type: 'assessment' | 'attendance' | 'homework' | 'video' | 'message' | 'result'
  title: string
  description: string
  date: string
  score?: number
  status?: string
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('files')) {
        const store = db.createObjectStore('files', { keyPath: 'id' })
        store.createIndex('studentId', 'studentId', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('folder', 'folder', { unique: false })
      }
      if (!db.objectStoreNames.contains('activity')) {
        const store = db.createObjectStore('activity', { keyPath: 'id' })
        store.createIndex('studentId', 'studentId', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('date', 'date', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/* ─── Files (homework + videos) ─── */

export async function uploadFile(record: Omit<FileRecord, 'id' | 'uploadedAt'>): Promise<string> {
  const db = await openDB()
  const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const full: FileRecord = { ...record, id, uploadedAt: new Date().toISOString() }
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite')
    tx.objectStore('files').add(full)
    tx.oncomplete = () => resolve(id)
    tx.onerror = () => reject(tx.error)
  })
}

export async function getStudentFiles(studentId: number): Promise<FileRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly')
    const index = tx.objectStore('files').index('studentId')
    const req = index.getAll(studentId)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getAllFiles(type?: 'homework' | 'video' | 'document'): Promise<FileRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly')
    let req: IDBRequest<FileRecord[]>
    if (type) {
      req = tx.objectStore('files').index('type').getAll(type)
    } else {
      req = tx.objectStore('files').getAll()
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteFile(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite')
    tx.objectStore('files').delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function gradeFile(id: string, grade: number, comment: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction('files', 'readwrite')
  const store = tx.objectStore('files')
  const req = store.get(id)
  req.onsuccess = () => {
    const record = req.result
    if (record) {
      record.graded = true
      record.grade = grade
      record.teacherComment = comment
      store.put(record)
    }
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/* ─── Activity Feed (aggregated per student) ─── */

export async function logActivity(entry: Omit<StudentActivityEntry, 'id'>): Promise<string> {
  const db = await openDB()
  const id = `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const full: StudentActivityEntry = { ...entry, id }
  return new Promise((resolve, reject) => {
    const tx = db.transaction('activity', 'readwrite')
    tx.objectStore('activity').add(full)
    tx.oncomplete = () => resolve(id)
    tx.onerror = () => reject(tx.error)
  })
}

export async function getStudentActivity(studentId: number): Promise<StudentActivityEntry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('activity', 'readonly')
    const index = tx.objectStore('activity').index('studentId')
    const req = index.getAll(studentId)
    req.onsuccess = () => resolve(req.result.sort((a, b) => b.date.localeCompare(a.date)))
    req.onerror = () => reject(req.error)
  })
}

export async function getAllActivity(): Promise<StudentActivityEntry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('activity', 'readonly')
    const req = tx.objectStore('activity').getAll()
    req.onsuccess = () => resolve(req.result.sort((a, b) => b.date.localeCompare(a.date)))
    req.onerror = () => reject(req.error)
  })
}

/* ─── Aggregate student records from localStorage stores ─── */

export interface AggregatedStudentRecord {
  id: number
  name: string
  email: string
  phone: string
  role: string
  teacher: string
  classroomNum: number
  level: string
  attendanceRate: number
  totalAttendance: number
  presentCount: number
  avgScore: number | null
  assessmentCount: number
  fileCount: number
  videoCount: number
  homeworkCount: number
  messageCount: number
  lastActivity: string
  activityLog: StudentActivityEntry[]
  files: FileRecord[]
}

export function aggregateFromLocalStorage(studentId: number, studentName: string): Partial<AggregatedStudentRecord> {
  /* Attendance */
  let presentCount = 0
  let totalAttendance = 0
  try {
    const sheets = JSON.parse(localStorage.getItem('b44_attendance_sheets') || '[]')
    const rows = JSON.parse(localStorage.getItem('b44_attendance_rows') || '[]')
    const studentRows = rows.filter((r: any) => r.studentName === studentName || r.studentId === studentId)
    totalAttendance = studentRows.length
    presentCount = studentRows.filter((r: any) => r.present === true).length
  } catch {}

  /* Assessment scores */
  let avgScore: number | null = null
  let assessmentCount = 0
  try {
    const scores = JSON.parse(localStorage.getItem('b44_assessment_scores') || '[]')
    const studentScores = scores.filter((s: any) => s.studentName === studentName || s.studentId === studentId)
    assessmentCount = studentScores.length
    const vals = studentScores.filter((s: any) => typeof s.score === 'number').map((s: any) => s.score)
    if (vals.length > 0) avgScore = Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10
  } catch {}

  return {
    presentCount, totalAttendance,
    attendanceRate: totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0,
    avgScore, assessmentCount,
  }
}
