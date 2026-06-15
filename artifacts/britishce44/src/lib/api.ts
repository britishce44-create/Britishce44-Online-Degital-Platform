// Thin fetch wrapper for the Britishce44 API.
// Attaches the bearer token from localStorage and normalises errors.

const BASE = '/api/v1'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('b44_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestInit = {},
): Promise<T> {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(opts.headers as Record<string, string> | undefined),
    },
  })
  if (!res.ok) {
    let message = res.statusText
    try {
      const data = await res.json()
      if (data?.message) message = data.message
    } catch {
      /* response had no JSON body */
    }
    throw new ApiError(res.status, message)
  }
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export const apiGet = <T = unknown>(path: string) => apiFetch<T>(path)
export const apiPost = <T = unknown>(path: string, body?: unknown) =>
  apiFetch<T>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
export const apiPatch = <T = unknown>(path: string, body?: unknown) =>
  apiFetch<T>(path, {
    method: 'PATCH',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
export const apiDelete = <T = unknown>(path: string) =>
  apiFetch<T>(path, { method: 'DELETE' })

/* ── Shared API entity types ── */

export interface Course {
  id: number
  name: string
  level: string
  teacherId: number | null
  termLabel: string
  termStartDate: string
  teachingWeekdays: number[]
  teacherName?: string | null
  studentCount?: number
}

export interface Criterion {
  id: number
  key: string
  labelEn: string
  labelAr: string
  orderIndex: number
  active: boolean
}

export interface SheetStudent {
  id: number
  name: string
  level: string | null
  parentName: string | null
}

export type SheetStatus = 'open' | 'submitted' | 'locked'
export type SheetPhase = 'first' | 'last'

export interface Sheet {
  id: number
  courseId: number
  termLabel: string
  phase: SheetPhase
  teachingDay: number
  dueDate: string
  status: SheetStatus
  submittedAt: string | null
  reportsGeneratedAt: string | null
  createdAt: string
}

export interface SheetGrid {
  sheet: Sheet
  course: Course & { teacherName?: string | null }
  criteria: Criterion[]
  students: SheetStudent[]
  scores: Record<number, Record<number, number | null>>
}

export interface Report {
  id: number
  sheetId: number
  studentId: number
  courseId: number
  audience: 'parent' | 'teacher'
  language: 'en' | 'ar'
  kind?: 'student' | 'teacher_eval'
  evalSheetId?: number | null
  evalTeacherId?: number | null
  recipientEmail: string | null
  recipientName: string | null
  level: string | null
  body: string
  status: 'draft' | 'edited' | 'sent'
  emailStatus: 'pending' | 'sent' | 'skipped' | 'failed'
  emailError: string | null
  sentAt: string | null
  driveStatus: 'pending' | 'archived' | 'skipped' | 'failed'
  driveFileId: string | null
  driveLink: string | null
  createdAt: string
  updatedAt: string
  studentName?: string | null
  courseName?: string | null
  teacherName?: string | null
}

/* ── Teacher evaluation types ── */

export type EvalLayout = 'columns' | 'weekly'
export type EvalCritKind = 'score' | 'text'

export interface EvalCriterion {
  id: number
  templateId: number
  key: string
  labelEn: string
  labelAr: string | null
  kind: EvalCritKind
  maxScore: number
  orderIndex: number
  active: boolean
}

export interface EvalTemplate {
  id: number
  key: string
  name: string
  nameAr: string | null
  subjectType: string
  layout: EvalLayout
  termLabel: string | null
  description: string | null
  orderIndex: number
  active: boolean
  criteria: EvalCriterion[]
}

export interface EvalSheet {
  id: number
  templateId: number
  termLabel: string
  weekLabel: string
  dueDate: string | null
  status: SheetStatus
  submittedAt: string | null
  reportsGeneratedAt: string | null
  createdAt: string
}

export interface EvalTeacherRef {
  id: number
  name: string
  email: string | null
}

export type EvalScoreCell = { score: number | null; note: string | null }

export interface EvalGrid {
  sheet: EvalSheet
  template: EvalTemplate
  criteria: EvalCriterion[]
  teachers: EvalTeacherRef[]
  days: number[]
  scores: Record<number, Record<number, Record<number, EvalScoreCell>>>
  dayMeta: Record<number, Record<number, number | null>>
}

export interface Task {
  id: number
  title: string
  description: string | null
  assigneeType: string | null
  assigneeId: number | null
  courseId: number | null
  sheetId: number | null
  dueDate: string | null
  type: string | null
  status: 'pending' | 'done'
  createdAt: string
}

export interface AppNotification {
  id: number
  audienceRole: string | null
  recipientEmail: string | null
  title: string
  body: string | null
  category: string | null
  icon: string | null
  read: boolean
  createdAt: string
}

export interface CalendarEvent {
  id: number
  title: string
  description: string | null
  date: string
  type: string | null
  courseId: number | null
  googleEventId: string | null
  createdAt: string
}

export interface Message {
  id: number
  threadKey: string
  fromName: string
  toEmail: string | null
  toRole: string | null
  body: string
  createdAt: string
}

export interface GoogleStatus {
  gmail: boolean
  drive: boolean
  calendar: boolean
  connected: boolean
  sender: string
}
