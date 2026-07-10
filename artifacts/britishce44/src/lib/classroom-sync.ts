export type ClassroomStatus = 'live' | 'scheduled' | 'empty' | 'locked'

export interface ClassroomTheme {
  accent: string
  background: string
  border: string
  highlight: string
}

export interface ClassroomScheduleEntry {
  id: string
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
  startTime: string
  endTime: string
  subject: string
  teacher: string
  title: string
}

export interface ClassroomProfile {
  id: number
  name: string
  grade: string
  subject: string
  teacher: string
  students: number
  status: ClassroomStatus
  startTime?: string
  theme: ClassroomTheme
  schedule: ClassroomScheduleEntry[]
}

export interface StudentClassroomAssignment {
  classroomId: number
  classroomName: string
  teacher: string
  level: string
  roomNumber: number
  classroomTheme?: string
}

const CLASSROOMS_KEY = 'b44_classrooms'
const ASSIGNMENTS_KEY = 'b44_student_classroom_assignments'
const CLASSROOM_STATUS_SEQUENCE: ClassroomStatus[] = ['live', 'scheduled', 'empty', 'empty', 'locked', 'live', 'scheduled', 'empty']
const TEACHERS = [
  'Suhair Almojahid', "Wa'ad Alhammadi", 'Jamal Alshameeri',
  'Amani Alsharabi', 'Khadeejah Alghaily', 'Shihab Alomary',
  'Nadia Alqaiti', 'Hassan Almakhlafi', 'Rania Althawr',
]
const SUBJECTS = ['Mathematics', 'English', 'Science', 'History', 'Arabic', 'ICT', 'Physics', 'Chemistry', 'Biology', 'Geography']
const START_TIMES = ['08:00', '09:30', '11:00', '13:00', '14:30', '16:00']
const THEMES: ClassroomTheme[] = [
  { accent: '#3b82f6', background: 'linear-gradient(145deg, #1f3c88 0%, #122055 100%)', border: 'rgba(59,130,246,0.2)', highlight: 'rgba(59,130,246,0.22)' },
  { accent: '#00ae74', background: 'linear-gradient(145deg, #0f3d2b 0%, #0d2f1e 100%)', border: 'rgba(0,174,116,0.2)', highlight: 'rgba(0,174,116,0.22)' },
  { accent: '#a78bfa', background: 'linear-gradient(145deg, #3d2b7a 0%, #24184a 100%)', border: 'rgba(167,139,250,0.2)', highlight: 'rgba(167,139,250,0.22)' },
  { accent: '#f59e0b', background: 'linear-gradient(145deg, #6b3b08 0%, #4a2406 100%)', border: 'rgba(245,158,11,0.2)', highlight: 'rgba(245,158,11,0.22)' },
]

function buildDefaultClassrooms(): ClassroomProfile[] {
  return Array.from({ length: 240 }, (_, i) => {
    const id = i + 1
    const status = CLASSROOM_STATUS_SEQUENCE[i % CLASSROOM_STATUS_SEQUENCE.length]
    const subject = SUBJECTS[i % SUBJECTS.length]
    const grade = `Grade ${Math.ceil((i + 1) / 24)}`
    const theme = THEMES[i % THEMES.length]
    return {
      id,
      name: `Classroom ${id}`,
      grade,
      subject,
      teacher: TEACHERS[i % TEACHERS.length],
      students: status === 'live' ? 12 + (i % 18) : 0,
      status,
      startTime: status === 'scheduled' ? START_TIMES[i % START_TIMES.length] : undefined,
      theme,
      schedule: [],
    }
  })
}

function isBrowser() {
  return typeof window !== 'undefined'
}

export function loadClassrooms(): ClassroomProfile[] {
  if (!isBrowser()) return buildDefaultClassrooms()
  try {
    const raw = window.localStorage.getItem(CLASSROOMS_KEY)
    if (!raw) return buildDefaultClassrooms()
    const parsed = JSON.parse(raw) as ClassroomProfile[]
    if (!Array.isArray(parsed) || parsed.length === 0) return buildDefaultClassrooms()
    return parsed.map((room) => ({ ...room, theme: room.theme || THEMES[0], schedule: room.schedule || [] }))
  } catch {
    return buildDefaultClassrooms()
  }
}

export function saveClassrooms(classrooms: ClassroomProfile[]) {
  if (!isBrowser()) return
  window.localStorage.setItem(CLASSROOMS_KEY, JSON.stringify(classrooms))
}

export function updateClassroom(id: number, patch: Partial<ClassroomProfile>) {
  const current = loadClassrooms()
  const next = current.map((room) => room.id === id ? { ...room, ...patch } : room)
  saveClassrooms(next)
  return next
}

export function getClassroomById(id: number | undefined | null): ClassroomProfile | undefined {
  if (!id) return undefined
  return loadClassrooms().find((room) => room.id === id)
}

export function saveClassroomSchedule(id: number, schedule: ClassroomScheduleEntry[]) {
  const current = loadClassrooms()
  const next = current.map((room) => room.id === id ? { ...room, schedule } : room)
  saveClassrooms(next)
  return next
}

export function loadStudentAssignments(): Record<string, StudentClassroomAssignment> {
  if (!isBrowser()) return {}
  try {
    const raw = window.localStorage.getItem(ASSIGNMENTS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveStudentAssignments(assignments: Record<string, StudentClassroomAssignment>) {
  if (!isBrowser()) return
  window.localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments))
}

export function setStudentClassroomAssignment(userKey: string, assignment: StudentClassroomAssignment) {
  const current = loadStudentAssignments()
  current[userKey] = assignment
  saveStudentAssignments(current)
  return current
}

export function getStudentClassroomAssignment(userKey: string | number | undefined | null): StudentClassroomAssignment | undefined {
  if (!userKey) return undefined
  const key = String(userKey)
  return loadStudentAssignments()[key]
}

export function resolveStudentClassroomAssignment(input: { id?: number | string; email?: string; name?: string; classroomId?: number; classroomName?: string; teacher?: string; level?: string; classroomTheme?: string }): StudentClassroomAssignment | undefined {
  const candidates = [input.id, input.email, input.name].filter(Boolean).map((value) => String(value))
  for (const key of candidates) {
    const match = getStudentClassroomAssignment(key)
    if (match) return match
  }
  if (input.classroomId) {
    const classroom = getClassroomById(Number(input.classroomId))
    if (classroom) {
      return {
        classroomId: classroom.id,
        classroomName: input.classroomName || classroom.name,
        teacher: input.teacher || classroom.teacher,
        level: input.level || classroom.grade,
        roomNumber: classroom.id,
        classroomTheme: input.classroomTheme || classroom.theme.accent,
      }
    }
  }
  return undefined
}

export function buildClassroomScheduleEvents(classroom: ClassroomProfile | undefined, weeks = 6) {
  if (!classroom) return []
  const events: Array<{ id: string; title: string; description: string; date: string; type: string }> = []
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  classroom.schedule.forEach((entry) => {
    for (let week = 0; week < weeks; week += 1) {
      const current = new Date(start)
      const dayIndex = dayOrder.indexOf(entry.day)
      const offset = (dayIndex - current.getDay() + 7) % 7 + week * 7
      current.setDate(current.getDate() + offset)
      events.push({
        id: `${classroom.id}-${entry.id}-${week}`,
        title: entry.title || `${classroom.name} · ${entry.subject}`,
        description: `${entry.subject} with ${entry.teacher} · ${entry.startTime}–${entry.endTime}`,
        date: current.toISOString().slice(0, 10),
        type: 'default',
      })
    }
  })

  return events
}

export function buildStudentScheduleEvents(student: { id?: number; email?: string; name?: string; classroomNum?: number; classroomName?: string; teacher?: string; classroomTheme?: string; level?: string } | null, count = 12) {
  const assignment = resolveStudentClassroomAssignment({
    id: student?.id,
    email: student?.email,
    name: student?.name,
    classroomId: student?.classroomNum,
    classroomName: student?.classroomName,
    teacher: student?.teacher,
    level: student?.level,
    classroomTheme: student?.classroomTheme,
  })

  const classroom = assignment ? getClassroomById(assignment.classroomId) : undefined
  const schedule = classroom?.schedule && classroom.schedule.length > 0
    ? classroom.schedule
    : [
        { id: 'fallback-1', day: 'Mon', startTime: '09:00', endTime: '10:00', subject: 'English', teacher: assignment?.teacher || classroom?.teacher || 'Teacher', title: assignment?.classroomName || classroom?.name || 'Class' },
      ]

  const events: Array<{ id: string; name: string; teacher: string; room: number; startTime: string; endTime: string; date: string; classroomName?: string; classroomTheme?: string; subject?: string }> = []
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  for (let week = 0; week < Math.ceil(count / Math.max(schedule.length, 1)); week += 1) {
    schedule.forEach((entry) => {
      const current = new Date(start)
      const dayIndex = dayOrder.indexOf(entry.day)
      const offset = (dayIndex - current.getDay() + 7) % 7 + week * 7
      current.setDate(current.getDate() + offset)
      events.push({
        id: `${student?.id || 'student'}-${entry.id}-${current.toISOString().slice(0, 10)}`,
        name: entry.title || `${assignment?.classroomName || classroom?.name || 'Class'} · ${entry.subject}`,
        teacher: entry.teacher || assignment?.teacher || classroom?.teacher || 'Teacher',
        room: assignment?.roomNumber || classroom?.id || student?.classroomNum || 1,
        startTime: entry.startTime,
        endTime: entry.endTime,
        date: current.toISOString().slice(0, 10),
        classroomName: assignment?.classroomName || classroom?.name,
        classroomTheme: assignment?.classroomTheme || classroom?.theme.accent,
        subject: entry.subject,
      })
    })
  }

  return events
    .filter((event) => new Date(`${event.date}T${event.startTime}`).getTime() >= Date.now() - 2 * 24 * 60 * 60 * 1000)
    .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime())
    .slice(0, count)
}
