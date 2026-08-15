import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { apiGet, apiPost, apiPatch, apiDelete, apiUpload } from '@/lib/api'

interface Classroom {
  id: number
  roomId: number
  label: string
  status: string
  active: boolean
  courseId: number
  courseName?: string
}

interface EligibleUser {
  id: number
  email: string
  name: string
  role: 'student' | 'teacher'
  status: string
  teacherId?: number | null
  studentId?: number | null
  lastSeen: string
  currentClassroom?: number | null
  isAssigned?: boolean
}

interface Assignment {
  id: number
  userId: number
  userRole: string
  classroomId: number
  assignedBy: number
  assignmentType: string
  status: string
  startDate: string
  endDate: string | null
  loginTime: string
  leaveTime: string
  earlyLoginAllowance: number
  timezone: string
  scheduleFrequency: string
  scheduleDays: number[]
  userName: string
  userEmail: string
  classroomLabel: string
}

interface ClassroomSchedule {
  id: number
  classroomId: number
  teacherId: number | null
  startDate: string
  endDate: string | null
  startTime: string
  endTime: string
  timezone: string
  frequency: string
  days: number[]
  isActive: boolean
}

interface AccessPolicy {
  classroomId: number
  allowRoom1Access: boolean
  room1Policy: string
  allowedClassroomIds: number[]
  requireTeacherApproval: boolean
  capacity: number
  allowOverride: boolean
  isLocked: boolean
  lockReason: string | null
}

interface Capacity {
  classroomId: number
  maxStudents: number
  currentCount: number
  allowWaitlist: boolean
  waitlistCount: number
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const ROOM1_POLICIES = ['always', 'scheduled', 'assigned_only', 'waiting_room', 'emergency']
const FREQUENCIES = ['once', 'daily', 'weekly', 'custom']

export function ClassroomAssignmentManager() {
  const [tab, setTab] = useState<'assign' | 'schedules' | 'policies' | 'audit'>('assign')
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [schedules, setSchedules] = useState<ClassroomSchedule[]>([])
  const [policies, setPolicies] = useState<Record<number, AccessPolicy>>({})
  const [capacities, setCapacities] = useState<Record<number, Capacity>>({})
  const [selectedClassroom, setSelectedClassroom] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'student' | 'teacher' | 'all'>('all')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Assignment form state
  const [formData, setFormData] = useState({
    userId: '',
    classroomId: '',
    assignmentType: 'permanent' as 'permanent' | 'temporary',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    loginTime: '09:00',
    leaveTime: '10:00',
    earlyLoginAllowance: 0,
    timezone: 'UTC',
    scheduleFrequency: 'weekly',
    scheduleDays: [] as number[],
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [roomsRes, usersRes, assignmentsRes] = await Promise.all([
        apiGet<{ classrooms: Classroom[] }>('/classroom-assignments/classrooms'),
        apiGet<{ users: EligibleUser[] }>('/classroom-assignments/eligible-users?role=all'),
        apiGet<{ assignments: Assignment[] }>('/classroom-assignments?limit=200'),
      ])
      setClassrooms(roomsRes.classrooms)
      setEligibleUsers(usersRes.users)
      setAssignments(assignmentsRes.assignments)

      // Load schedules and policies for each classroom
      for (const room of roomsRes.classrooms) {
        try {
          const [schedRes, policyRes, capacityRes] = await Promise.all([
            apiGet<{ schedules: ClassroomSchedule[] }>(`/classroom-schedules/${room.id}`),
            apiGet<{ policy: AccessPolicy }>(`/classroom-access-policies/${room.id}`),
            apiGet<{ capacity: Capacity }>(`/classroom-capacity/${room.id}`),
          ])
          if (schedRes.schedules?.length) setSchedules(prev => ({ ...prev, [room.id]: schedRes.schedules }))
          if (policyRes.policy) setPolicies(prev => ({ ...prev, [room.id]: policyRes.policy }))
          if (capacityRes.capacity) setCapacities(prev => ({ ...prev, [room.id]: capacityRes.capacity }))
        } catch (err) {
          console.warn(`Failed to load data for classroom ${room.id}:`, err)
        }
      }
    } catch (err) {
      setError('Failed to load data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleAssign = async () => {
    if (!formData.userId || !formData.classroomId || !formData.startDate) {
      setError('Please fill all required fields')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiPost('/classroom-assignments', formData)
      setSuccess('Assignment created successfully')
      setShowAssignModal(false)
      setEditingAssignment(null)
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAssign = async () => {
    // Implementation for bulk assign
  }

  const handleUpdateAssignment = async (id: number, data: Partial<Assignment>) => {
    try {
      await apiPatch(`/classroom-assignments/${id}`, data)
      setSuccess('Assignment updated')
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update')
    }
  }

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm('End this assignment? The student/teacher will be removed from the classroom.')) return
    try {
      await apiDelete(`/classroom-assignments/${id}`)
      setSuccess('Assignment ended')
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to end assignment')
    }
  }

  const openAssignModal = (assignment?: Assignment) => {
    if (assignment) {
      setEditingAssignment(assignment)
      setFormData({
        userId: String(assignment.userId),
        classroomId: String(assignment.classroomId),
        assignmentType: assignment.assignmentType,
        startDate: assignment.startDate.split('T')[0],
        endDate: assignment.endDate?.split('T')[0] || '',
        loginTime: assignment.loginTime,
        leaveTime: assignment.leaveTime,
        earlyLoginAllowance: assignment.earlyLoginAllowance,
        timezone: assignment.timezone,
        scheduleFrequency: assignment.scheduleFrequency,
        scheduleDays: assignment.scheduleDays || [],
      })
    } else {
      setEditingAssignment(null)
      setFormData({
        userId: '',
        classroomId: '',
        assignmentType: 'permanent',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        loginTime: '09:00',
        leaveTime: '10:00',
        earlyLoginAllowance: 0,
        timezone: 'UTC',
        scheduleFrequency: 'weekly',
        scheduleDays: [],
      })
    }
    setShowAssignModal(true)
  }

  const filteredUsers = eligibleUsers.filter(u => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (selectedClassroom && u.currentClassroom !== selectedClassroom && u.currentClassroom !== null) return false
    return true
  })

  const filteredAssignments = assignments.filter(a => {
    if (selectedClassroom && a.classroomId !== selectedClassroom) return false
    return true
  })

  // Summary stats
  const totalStudents = eligibleUsers.filter(u => u.role === 'student').length
  const assignedStudents = eligibleUsers.filter(u => u.role === 'student' && u.isAssigned).length
  const unassignedStudents = totalStudents - assignedStudents
  const totalTeachers = eligibleUsers.filter(u => u.role === 'teacher').length
  const liveClassrooms = classrooms.filter(c => c.status === 'live').length
  const onlineStudents = assignments.filter(a => a.status === 'active').length

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading classroom assignments…</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-gradient-aurora flex items-center gap-2">
            🎓 Classroom Assignment & Management
          </h2>
          <p className="text-sm mt-1 text-gray-500">
            Assign students & teachers, manage schedules, set access policies
          </p>
        </div>
        <button onClick={() => openAssignModal()} className="px-4 py-2 rounded-xl text-sm font-bold transition"
          style={{ background: 'linear-gradient(135deg,#2563eb,#2620a8)', color: '#fff', boxShadow: '0 2px 12px rgba(37,99,235,0.35)' }}>
          + Assign User
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Students', value: totalStudents, color: '#34d399', icon: '🎓' },
          { label: 'Assigned', value: assignedStudents, color: '#00ae74', icon: '✅' },
          { label: 'Unassigned', value: unassignedStudents, color: '#f59e0b', icon: '⏳' },
          { label: 'Teachers', value: totalTeachers, color: '#2563eb', icon: '👩‍🏫' },
          { label: 'Live Rooms', value: liveClassrooms, color: '#f87171', icon: '🔴' },
          { label: 'Online Now', value: onlineStudents, color: '#8b5cf6', icon: '🟢' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl p-4 cursor-pointer hover:shadow-lg transition"
            style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${stat.color}30` }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{stat.icon}</span>
              <span className="text-xs font-bold text-gray-500">{stat.label}</span>
            </div>
            <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1" style={{ border: '1px solid rgba(37,99,235,0.1)' }}>
        {[
          { id: 'assign', label: 'Assign Users', icon: '👥' },
          { id: 'schedules', label: 'Schedules', icon: '📅' },
          { id: 'policies', label: 'Access Policies', icon: '🔐' },
          { id: 'audit', label: 'Audit Log', icon: '📋' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.id ? 'text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            style={{ background: tab === t.id ? 'linear-gradient(135deg,#2563eb,#2620a8)' : 'transparent' }}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={selectedClassroom || ''} onChange={e => setSelectedClassroom(e.target.value ? Number(e.target.value) : null)}
          className="px-3 py-2 rounded-xl text-sm disabled:opacity-50"
          style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)', color: '#fff', minWidth: 200 }}>
          <option value="">All Classrooms</option>
          {classrooms.map(c => <option key={c.id} value={c.id}>{c.label} (Room {c.roomId})</option>)}
        </select>

        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)}
          className="px-3 py-2 rounded-xl text-sm"
          style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)', color: '#fff', minWidth: 140 }}>
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
        </select>

        <div className="relative flex-1 min-w-56 max-w-md">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)', color: '#fff' }} />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'assign' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Eligible Users */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              👥 Eligible Users <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>{filteredUsers.length}</span>
            </h3>
            <div className="rounded-2xl max-h-[500px] overflow-y-auto custom-scroll"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(37,99,235,0.08)' }}>
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No users match your filters</div>
              ) : (
                filteredUsers.map(u => (
                  <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-3 px-3 py-2.5 border-b hover:bg-white/5 transition cursor-pointer group"
                    style={{ borderColor: 'rgba(37,99,235,0.06)' }}
                    onClick={() => { if (!u.isAssigned) openAssignModal({ ...formData, userId: u.id, classroomId: selectedClassroom || undefined }) }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ background: u.role === 'teacher' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#2563eb,#2620a8)' }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{u.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${u.role === 'teacher' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {u.role}
                      </span>
                      {u.isAssigned && (
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Assigned</span>
                      )}
                      {u.currentClassroom && !u.isAssigned && (
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                          Room {u.currentClassroom}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Current Assignments */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              📋 Current Assignments <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>{filteredAssignments.length}</span>
            </h3>
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(37,99,235,0.08)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 border-b" style={{ borderColor: 'rgba(37,99,235,0.1)' }}>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Classroom</th>
                    <th className="px-4 py-3">Schedule</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No assignments found</td></tr>
                  ) : (
                    filteredAssignments.map(a => (
                      <tr key={a.id} className="border-b hover:bg-white/3 transition" style={{ borderColor: 'rgba(37,99,235,0.05)' }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
                              style={{ background: a.userRole === 'teacher' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#2563eb,#2620a8)' }}>
                              {a.userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-white">{a.userName}</p>
                              <p className="text-[10px] text-gray-500">{a.userEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${a.userRole === 'teacher' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {a.userRole}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{a.classroomLabel}</p>
                          <p className="text-[10px] text-gray-500">Room ID: {a.classroomId}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-white">{a.loginTime} – {a.leaveTime}</p>
                          <p className="text-[10px] text-gray-500">{a.scheduleFrequency} • {a.scheduleDays?.map(d => WEEKDAYS[d]).join(', ') || '—'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-medium px-2 py-1 rounded-full ${a.status === 'active' ? 'bg-green-500/20 text-green-400' : a.status === 'ended' ? 'bg-gray-500/20 text-gray-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-medium px-2 py-1 rounded-full ${a.assignmentType === 'permanent' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                            {a.assignmentType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openAssignModal(a)} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition" title="Edit">✏️</button>
                            <button onClick={() => handleDeleteAssignment(a.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition" title="End Assignment">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'schedules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">📅 Classroom Schedules</h3>
            <button className="px-4 py-2 rounded-xl text-sm font-bold transition"
              style={{ background: 'linear-gradient(135deg,#2563eb,#2620a8)', color: '#fff' }}>
              + Add Schedule
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classrooms.map(room => {
              const roomSchedules = schedules[room.id] || []
              return (
                <motion.div key={room.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(37,99,235,0.08)' }}>
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#2620a8)' }}>🏫</span>
                    {room.label}
                  </h4>
                  {roomSchedules.length === 0 ? (
                    <p className="text-sm text-gray-500">No schedules configured</p>
                  ) : (
                    <div className="space-y-2">
                      {roomSchedules.map(s => (
                        <div key={s.id} className="p-3 rounded-xl text-sm" style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.1)' }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-white">{s.startTime} – {s.endTime}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">{s.frequency}</span>
                          </div>
                          <div className="text-[10px] text-gray-500 flex flex-wrap gap-2">
                            <span>📅 {s.days?.map(d => WEEKDAYS[d]).join(', ') || 'Daily'}</span>
                            <span>🌍 {s.timezone}</span>
                            <span>{s.startDate.split('T')[0]} → {s.endDate?.split('T')[0] || 'Ongoing'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'policies' && (
        <div className="space-y-4">
          <h3 className="font-bold text-white">🔐 Classroom Access Policies</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classrooms.map(room => {
              const policy = policies[room.id] || { allowRoom1Access: true, room1Policy: 'always', allowedClassroomIds: [], requireTeacherApproval: false, capacity: 30, allowOverride: false, isLocked: false }
              const capacity = capacities[room.id] || { maxStudents: 30, currentCount: 0 }
              return (
                <motion.div key={room.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(37,99,235,0.08)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                        style={{ background: 'linear-gradient(135deg,#2563eb,#2620a8)' }}>🏫</span>
                      {room.label}
                    </h4>
                    <span className={`text-[9px] font-medium px-2 py-1 rounded-full ${policy.isLocked ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {policy.isLocked ? '🔒 Locked' : '🟢 Open'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Room 1 Access */}
                    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(37,99,235,0.05)' }}>
                      <div>
                        <p className="text-sm font-medium text-white">Room 1 Access</p>
                        <p className="text-[10px] text-gray-500">{policy.allowRoom1Access ? 'Allowed' : 'Restricted'}</p>
                      </div>
                      <span className={`text-[9px] font-medium px-2 py-1 rounded-full ${policy.allowRoom1Access ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {policy.allowRoom1Access ? '✅ Allowed' : '🚫 Denied'}
                      </span>
                    </div>

                    {/* Room 1 Policy */}
                    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(37,99,235,0.05)' }}>
                      <div>
                        <p className="text-sm font-medium text-white">Room 1 Policy</p>
                        <p className="text-[10px] text-gray-500">{policy.room1Policy}</p>
                      </div>
                      <select className="px-2 py-1 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(37,99,235,0.15)', color: '#fff' }}>
                        {ROOM1_POLICIES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    {/* Capacity */}
                    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(37,99,235,0.05)' }}>
                      <div>
                        <p className="text-sm font-medium text-white">Capacity</p>
                        <p className="text-[10px] text-gray-500">{capacity.currentCount} / {capacity.maxStudents} students</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{capacity.currentCount} / {capacity.maxStudents}</span>
                        <input type="number" defaultValue={capacity.maxStudents} className="w-20 px-2 py-1 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(37,99,235,0.15)', color: '#fff' }} />
                      </div>
                    </div>

                    {/* Lock Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(37,99,235,0.05)' }}>
                      <div>
                        <p className="text-sm font-medium text-white">Classroom Locked</p>
                        <p className="text-[10px] text-gray-500">Prevents new students from joining</p>
                      </div>
                      <button className={`px-3 py-1.5 rounded-full text-xs font-medium ${policy.isLocked ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                        {policy.isLocked ? '🔒 Unlock' : '🔓 Lock'}
                      </button>
                    </div>

                    {/* Allowed Classrooms */}
                    <div className="flex items-start justify-between p-3 rounded-xl" style={{ background: 'rgba(37,99,235,0.05)' }}>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Cross-Classroom Access</p>
                        <p className="text-[10px] text-gray-500">Allowed classrooms: {policy.allowedClassroomIds?.length || 0}</p>
                      </div>
                      <button className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.3)' }}>
                        Configure
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-4">
          <h3 className="font-bold text-white">📋 Audit Log</h3>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(37,99,235,0.08)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 border-b" style={{ borderColor: 'rgba(37,99,235,0.1)' }}>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Performed By</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Classroom</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Audit log loading… (connect to /v1/classroom-audit-logs)</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
            style={{ background: '#071B78', border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg,#2563eb,#2620a8)' }}>👥</span>
                {editingAssignment ? 'Edit Assignment' : 'Assign User to Classroom'}
              </h3>
              <button onClick={() => { setShowAssignModal(false); setEditingAssignment(null) }} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            <form onSubmit={e => { e.preventDefault(); handleAssign() }} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">User</label>
                  <select value={formData.userId} onChange={e => setFormData({ ...formData, userId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', color: '#fff' }}>
                    <option value="">Select user</option>
                    {eligibleUsers.filter(u => !u.isAssigned || u.id === Number(formData.userId)).map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Classroom</label>
                  <select value={formData.classroomId} onChange={e => setFormData({ ...formData, classroomId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', color: '#fff' }}>
                    <option value="">Select classroom</option>
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.label} (Room {c.roomId})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Assignment Type</label>
                  <select value={formData.assignmentType} onChange={e => setFormData({ ...formData, assignmentType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', color: '#fff' }}>
                    <option value="permanent">Permanent</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Timezone</label>
                  <select value={formData.timezone} onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', color: '#fff' }}>
                    <option value="UTC">UTC</option>
                    <option value="AST">AST (UTC+3)</option>
                    <option value="GMT">GMT</option>
                    <option value="EST">EST (UTC-5)</option>
                    <option value="PST">PST (UTC-8)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Start Date</label>
                <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', color: '#fff' }} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">End Date (optional)</label>
                  <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', color: '#fff' }} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Early Login Allowance (min)</label>
                  <select value={formData.earlyLoginAllowance} onChange={e => setFormData({ ...formData, earlyLoginAllowance: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', color: '#fff' }}>
                    <option value={0}>No early access</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Class Login Time</label>
                  <input type="time" value={formData.loginTime} onChange={e => setFormData({ ...formData, loginTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', color: '#fff' }} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Class Leave Time</label>
                  <input type="time" value={formData.leaveTime} onChange={e => setFormData({ ...formData, leaveTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', color: '#fff' }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Schedule Frequency</label>
                <select value={formData.scheduleFrequency} onChange={e => setFormData({ ...formData, scheduleFrequency: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', color: '#fff' }}>
                  <option value="once">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Days (for weekly)</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day, i) => (
                    <label key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs cursor-pointer transition"
                      style={{ background: formData.scheduleDays.includes(i) ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', color: '#fff' }}>
                      <input type="checkbox" checked={formData.scheduleDays.includes(i)} onChange={e => setFormData({ ...formData, scheduleDays: e.target.checked ? [...formData.scheduleDays, i] : formData.scheduleDays.filter(d => d !== i) })} className="w-3 h-3 accent-amber-500" />
                      {day}
                    </label>
                  ))}
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}
              {success && <p className="text-green-400 text-sm">{success}</p>}

              <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'rgba(212,175,55,0.2)' }}>
                <button type="button" onClick={() => { setShowAssignModal(false); setEditingAssignment(null) }} className="px-4 py-2 rounded-xl text-sm font-medium transition" style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2 rounded-xl text-sm font-bold transition" style={{ background: 'linear-gradient(135deg,#D4AF37,#E5B93F)', color: '#071B78', boxShadow: '0 4px 16px rgba(212,175,55,0.4)' }}>
                  {loading ? 'Saving…' : (editingAssignment ? 'Update Assignment' : 'Create Assignment')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}