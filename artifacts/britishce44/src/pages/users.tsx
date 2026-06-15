
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Role = 'admin' | 'teacher' | 'student' | 'supervisor' | 'parent'
type Status = 'active' | 'inactive' | 'suspended'

interface Permission { key: string; label: string; labelAr: string }
interface User {
  id: number; name: string; email: string; role: Role; status: Status
  lastSeen: string; classrooms?: number; grade?: string; phone?: string
  accessFrom?: string; accessTo?: string; permissions?: string[]
  joinDate?: string; courses?: string[]
}

const ALL_PERMISSIONS: Permission[] = [
  { key:'classrooms',  label:'Enter Classrooms',     labelAr:'دخول الفصول' },
  { key:'exams',       label:'Take / Manage Exams',  labelAr:'الاختبارات' },
  { key:'messenger',   label:'CE4 Messenger',         labelAr:'المراسلة' },
  { key:'homework',    label:'Homework Dropbox',       labelAr:'الواجبات' },
  { key:'reports',     label:'View Reports',           labelAr:'التقارير' },
  { key:'recordings',  label:'Access Recordings',      labelAr:'التسجيلات' },
  { key:'placements',  label:'Placement Tests',        labelAr:'اختبار المستوى' },
  { key:'analytics',   label:'Live Analytics',         labelAr:'الإحصائيات' },
]

const SEED: User[] = [
  { id:1, name:'Admin — Britishce44', email:'britishce44@gmail.com', role:'admin', status:'active', lastSeen:'Now', phone:'+967 770 000 001', joinDate:'2020-01-01', accessFrom:'00:00', accessTo:'23:59', permissions:ALL_PERMISSIONS.map(p=>p.key) },
  { id:2, name:'Suhair Almojahid', email:'suhair@britishce44.edu', role:'teacher', status:'active', lastSeen:'5 min ago', classrooms:5, phone:'+967 770 000 002', joinDate:'2021-03-12', accessFrom:'07:00', accessTo:'22:00', permissions:['classrooms','exams','messenger','homework','reports','recordings'] },
  { id:3, name:"Wa'ad Alhammadi", email:'waad@britishce44.edu', role:'teacher', status:'active', lastSeen:'1 hr ago', classrooms:4, phone:'+967 770 000 003', joinDate:'2021-06-01', accessFrom:'07:00', accessTo:'20:00', permissions:['classrooms','exams','messenger','homework'] },
  { id:4, name:'Jamal Alshameeri', email:'jamal@britishce44.edu', role:'teacher', status:'active', lastSeen:'2 hr ago', classrooms:6, phone:'+967 770 000 004', joinDate:'2021-09-15', accessFrom:'08:00', accessTo:'21:00', permissions:['classrooms','exams','messenger','homework','recordings'] },
  { id:5, name:'Amani Alsharabi', email:'amani@britishce44.edu', role:'teacher', status:'inactive', lastSeen:'3 days ago', classrooms:3, phone:'+967 770 000 005', joinDate:'2022-01-01', accessFrom:'09:00', accessTo:'18:00', permissions:['classrooms','messenger'] },
  { id:6, name:'Supervisor Ali Hassan', email:'ali@britishce44.edu', role:'supervisor', status:'active', lastSeen:'30 min ago', phone:'+967 770 000 006', joinDate:'2020-06-01', accessFrom:'06:00', accessTo:'23:00', permissions:ALL_PERMISSIONS.map(p=>p.key) },
  { id:7, name:'Ahmed Nasser', email:'ahmed@britishce44.edu', role:'student', status:'active', lastSeen:'10 min ago', grade:'Gogo 3', phone:'+967 770 000 007', joinDate:'2023-09-01', accessFrom:'08:00', accessTo:'20:00', permissions:['classrooms','exams','messenger','homework','placements'] },
  { id:8, name:'Mona Alqaiti', email:'mona@britishce44.edu', role:'student', status:'active', lastSeen:'1 hr ago', grade:'Speakout Int', phone:'+967 770 000 008', joinDate:'2023-09-01', accessFrom:'08:00', accessTo:'20:00', permissions:['classrooms','exams','messenger','homework'] },
  { id:9, name:'Omar Althawr', email:'omar@britishce44.edu', role:'student', status:'inactive', lastSeen:'1 week ago', grade:'Phonics 2', phone:'+967 770 000 009', joinDate:'2023-02-01', accessFrom:'09:00', accessTo:'18:00', permissions:['classrooms'] },
  { id:10, name:'Sara Almahdi', email:'sara@britishce44.edu', role:'student', status:'active', lastSeen:'15 min ago', grade:'Gogo 5', phone:'+967 770 000 010', joinDate:'2023-05-01', accessFrom:'08:00', accessTo:'20:00', permissions:['classrooms','exams','messenger','homework','placements'] },
  { id:11, name:'Hassan Almakhlafi', email:'hassan@britishce44.edu', role:'teacher', status:'active', lastSeen:'20 min ago', classrooms:7, phone:'+967 770 000 011', joinDate:'2022-09-01', accessFrom:'07:00', accessTo:'22:00', permissions:['classrooms','exams','messenger','homework','reports','recordings'] },
  { id:12, name:'Fatima Alomari', email:'fatima@britishce44.edu', role:'parent', status:'active', lastSeen:'2 days ago', phone:'+967 770 000 012', joinDate:'2023-09-01', accessFrom:'06:00', accessTo:'23:00', permissions:['reports'] },
  { id:13, name:'Khaled Alghaily', email:'khaled@britishce44.edu', role:'student', status:'suspended', lastSeen:'5 days ago', grade:'Gogo 2', phone:'+967 770 000 013', joinDate:'2023-01-01', accessFrom:'08:00', accessTo:'18:00', permissions:[] },
  { id:14, name:'Nadia Alqaiti', email:'nadia@britishce44.edu', role:'teacher', status:'active', lastSeen:'45 min ago', classrooms:5, phone:'+967 770 000 014', joinDate:'2022-03-01', accessFrom:'07:00', accessTo:'21:00', permissions:['classrooms','exams','messenger','homework','recordings'] },
  { id:15, name:'Ibrahim Almojahid', email:'ibrahim@britishce44.edu', role:'student', status:'active', lastSeen:'3 hr ago', grade:'Phonics 3', phone:'+967 770 000 015', joinDate:'2023-09-01', accessFrom:'08:00', accessTo:'20:00', permissions:['classrooms','exams','messenger','homework'] },
]

const ROLE_CFG: Record<Role,{color:string;bg:string;emoji:string;label:string}> = {
  admin:      { color:'#fbbf24', bg:'rgba(251,191,36,0.12)',  emoji:'👑',  label:'Admin' },
  teacher:    { color:'#60a5fa', bg:'rgba(129,140,248,0.12)', emoji:'👩‍🏫', label:'Teacher' },
  supervisor: { color:'#34d399', bg:'rgba(52,211,153,0.12)',  emoji:'🔭',  label:'Supervisor' },
  student:    { color:'#38bdf8', bg:'rgba(56,189,248,0.10)',  emoji:'🎓',  label:'Student' },
  parent:     { color:'#fb923c', bg:'rgba(251,146,60,0.10)',  emoji:'👪',  label:'Parent' },
}
const STATUS_CFG: Record<Status,{color:string;label:string;dot:string}> = {
  active:    { color:'#34d399', label:'Active',    dot:'bg-emerald-400 animate-pulse' },
  inactive:  { color:'#94a3b8', label:'Inactive',  dot:'bg-slate-400' },
  suspended: { color:'#f87171', label:'Suspended', dot:'bg-red-400' },
}

function Avatar({name,role}:{name:string;role:Role}) {
  const c=ROLE_CFG[role]
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
      style={{background:c.bg,color:c.color,border:`1.5px solid ${c.color}30`}}>
      {name.charAt(0)}
    </div>
  )
}

function EditModal({user,onSave,onClose}:{user:User;onSave:(u:User)=>void;onClose:()=>void}) {
  const [form,setForm]=useState({...user,permissions:user.permissions??[]})
  const perms=form.permissions
  const toggle=(key:string)=>setForm(f=>({...f,permissions:perms.includes(key)?perms.filter(p=>p!==key):[...perms,key]}))
  const inp="w-full rounded-lg px-3 py-2 text-sm text-white outline-none bg-white/5 border border-white/10 focus:border-indigo-400/60 placeholder-white/25 transition"
  const isNew=!SEED.find(u=>u.id===user.id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)'}}>
      <motion.div initial={{opacity:0,scale:0.94}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.94}}
        className="w-full max-w-2xl rounded-2xl overflow-auto shadow-2xl" style={{background:'#1d1668',border:'1px solid rgba(63, 186, 235,0.30)',maxHeight:'90vh'}}>
        <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-400" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-black text-white">{isNew?'➕ Add New User':'✏️ Edit User'}</h3>
            <button onClick={onClose} className="text-white/30 hover:text-white text-2xl leading-none">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest mb-1.5">Full Name</label>
              <input className={inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Full name…" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest mb-1.5">Email</label>
              <input className={inp} type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@example.com" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest mb-1.5">Phone / WhatsApp</label>
              <input className={inp} value={form.phone??''} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+967 7XX XXX XXX" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest mb-1.5">Role</label>
              <select className={`${inp} bg-[#1d1668]`} value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value as Role}))}>
                {(Object.keys(ROLE_CFG) as Role[]).map(r=><option key={r} value={r}>{ROLE_CFG[r].emoji} {ROLE_CFG[r].label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest mb-1.5">Status</label>
              <select className={`${inp} bg-[#1d1668]`} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value as Status}))}>
                <option value="active">✅ Active</option>
                <option value="inactive">⏸ Inactive</option>
                <option value="suspended">🚫 Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest mb-1.5">Access From (time)</label>
              <input type="time" className={inp} value={form.accessFrom??'07:00'} onChange={e=>setForm(f=>({...f,accessFrom:e.target.value}))} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest mb-1.5">Access Until (time)</label>
              <input type="time" className={inp} value={form.accessTo??'22:00'} onChange={e=>setForm(f=>({...f,accessTo:e.target.value}))} />
            </div>
          </div>

          {/* Permissions */}
          <div className="mb-5 p-4 rounded-xl" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black text-white/70 uppercase tracking-widest">🔐 Platform Permissions</p>
              <div className="flex gap-2">
                <button onClick={()=>setForm(f=>({...f,permissions:ALL_PERMISSIONS.map(p=>p.key)}))}
                  className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{background:'rgba(52,211,153,0.15)',color:'#34d399'}}>Grant All</button>
                <button onClick={()=>setForm(f=>({...f,permissions:[]}))}
                  className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{background:'rgba(248,113,113,0.15)',color:'#f87171'}}>Revoke All</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_PERMISSIONS.map(p=>{
                const on=perms.includes(p.key)
                return (
                  <button key={p.key} onClick={()=>toggle(p.key)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl text-left transition"
                    style={{background:on?'rgba(63, 186, 235,0.12)':'rgba(255,255,255,0.02)',border:`1px solid ${on?'rgba(63, 186, 235,0.35)':'rgba(255,255,255,0.05)'}`}}>
                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{background:on?'#3b82f6':'rgba(255,255,255,0.04)',border:`1px solid ${on?'#3b82f6':'rgba(255,255,255,0.12)'}`}}>
                      {on&&<span className="text-[8px] text-white font-black">✓</span>}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-white leading-none">{p.label}</p>
                      <p className="text-[9px] text-white/35 mt-0.5" style={{fontFamily:'Tajawal,sans-serif'}}>{p.labelAr}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-white/40 border border-white/08 hover:border-white/20 transition">Cancel</button>
            <button onClick={()=>onSave(form)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition"
              style={{background:'linear-gradient(135deg,#3b82f6,#2563eb)',color:'#fff',boxShadow:'0 4px 20px rgba(63, 186, 235,0.28)'}}>
              💾 Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export function UsersPage() {
  const [users,setUsers]=useState<User[]>(SEED)
  const [search,setSearch]=useState('')
  const [roleFilter,setRoleFilter]=useState<Role|'all'>('all')
  const [statusFilter,setStatusFilter]=useState<Status|'all'>('all')
  const [editUser,setEditUser]=useState<User|null>(null)
  const [delConfirm,setDelConfirm]=useState<number|null>(null)
  const [showAdd,setShowAdd]=useState(false)
  const [selected,setSelected]=useState<number[]>([])

  const NEW_USER: User={id:Date.now(),name:'',email:'',role:'student',status:'active',lastSeen:'Just now',phone:'',joinDate:new Date().toISOString().slice(0,10),accessFrom:'08:00',accessTo:'20:00',permissions:['classrooms','exams','messenger','homework']}

  const filtered=useMemo(()=>users.filter(u=>{
    const q=search.toLowerCase()
    return (u.name.toLowerCase().includes(q)||u.email.toLowerCase().includes(q))
      &&(roleFilter==='all'||u.role===roleFilter)
      &&(statusFilter==='all'||u.status===statusFilter)
  }),[users,search,roleFilter,statusFilter])

  const saveUser=(u:User)=>{
    setUsers(p=>{
      const exists=p.find(x=>x.id===u.id)
      return exists?p.map(x=>x.id===u.id?u:x):[...p,u]
    })
    setEditUser(null); setShowAdd(false)
  }
  const delUser=(id:number)=>{setUsers(p=>p.filter(u=>u.id!==id));setDelConfirm(null)}
  const toggleSel=(id:number)=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id])
  const allSel=filtered.length>0&&filtered.every(u=>selected.includes(u.id))

  const roleCounts=(Object.keys(ROLE_CFG) as Role[]).reduce((a,r)=>({...a,[r]:users.filter(u=>u.role===r).length}),{} as Record<Role,number>)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{background:'linear-gradient(135deg,#1d1668 0%,#131f40 100%)',border:'1px solid rgba(63, 186, 235,0.20)',boxShadow:'0 8px 32px rgba(8,15,34,0.30)'}}>
        <div className="absolute top-0 right-0 w-56 h-full opacity-8 pointer-events-none"
          style={{background:'radial-gradient(ellipse at right,#3b82f6,transparent)'}}/>
        <div className="relative flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">👥 Manage Users</h2>
            <p className="text-xs text-indigo-300/50 mt-0.5">{users.length} total accounts · Full permission &amp; access control</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {selected.length>0&&(
              <button onClick={()=>{setUsers(p=>p.filter(u=>!selected.includes(u.id)));setSelected([])}}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
                style={{background:'rgba(248,113,113,0.15)',color:'#f87171',border:'1px solid rgba(248,113,113,0.25)'}}>
                🗑 Delete {selected.length}
              </button>
            )}
            <button onClick={()=>setShowAdd(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold"
              style={{background:'linear-gradient(135deg,#3b82f6,#2563eb)',color:'#fff',boxShadow:'0 4px 16px rgba(63, 186, 235,0.28)'}}>
              ＋ Add User
            </button>
          </div>
        </div>
        {/* Role pills */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {(Object.keys(ROLE_CFG) as Role[]).map(r=>(
            <button key={r} onClick={()=>setRoleFilter(v=>v===r?'all':r)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition"
              style={{background:`${ROLE_CFG[r].color}${roleFilter===r?'20':'0d'}`,border:`1px solid ${ROLE_CFG[r].color}${roleFilter===r?'40':'20'}`}}>
              <span className="text-xs">{ROLE_CFG[r].emoji}</span>
              <span className="text-xs font-bold" style={{color:ROLE_CFG[r].color}}>{ROLE_CFG[r].label}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{background:`${ROLE_CFG[r].color}15`,color:ROLE_CFG[r].color}}>{roleCounts[r]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search + status filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 text-sm">🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition"
            style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'white'}} />
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.7)'}}>
          <option value="all">All Status</option>
          <option value="active">✅ Active</option>
          <option value="inactive">⏸ Inactive</option>
          <option value="suspended">🚫 Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{background:'rgba(8,14,32,0.90)',border:'1px solid rgba(255,255,255,0.06)',boxShadow:'0 4px 24px rgba(0,0,0,0.25)'}}>
        {/* Header row */}
        <div className="hidden md:grid px-4 py-3 text-[9px] font-bold uppercase tracking-widest border-b"
          style={{gridTemplateColumns:'36px 220px 1fr 100px 90px 120px 100px 80px',borderColor:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.25)'}}>
          <div>
            <input type="checkbox" checked={allSel} onChange={e=>setSelected(e.target.checked?filtered.map(u=>u.id):[])} className="accent-indigo-500 cursor-pointer" />
          </div>
          <div>User</div><div>Contact</div><div>Role</div>
          <div>Status</div><div>Access Hours</div><div>Last Seen</div><div>Actions</div>
        </div>

        <AnimatePresence>
          {filtered.map((u,i)=>{
            const rc=ROLE_CFG[u.role]; const sc=STATUS_CFG[u.status]; const isSel=selected.includes(u.id)
            return (
              <motion.div key={u.id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0,x:-20}}
                transition={{delay:i*0.02}}
                className="px-4 py-3 border-b hover:bg-white/[0.025] transition group cursor-default"
                style={{borderColor:'rgba(255,255,255,0.04)',background:isSel?'rgba(63, 186, 235,0.08)':undefined}}>
                {/* Mobile layout */}
                <div className="flex md:hidden items-center gap-3 mb-2">
                  <input type="checkbox" checked={isSel} onChange={()=>toggleSel(u.id)} className="accent-indigo-500" />
                  <Avatar name={u.name} role={u.role} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                    <p className="text-[10px] text-white/40 truncate">{u.email}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={()=>setEditUser(u)} className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/20">✏️</button>
                    <button onClick={()=>setDelConfirm(u.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20">🗑</button>
                  </div>
                </div>
                {/* Desktop grid */}
                <div className="hidden md:grid items-center gap-2"
                  style={{gridTemplateColumns:'36px 220px 1fr 100px 90px 120px 100px 80px'}}>
                  <input type="checkbox" checked={isSel} onChange={()=>toggleSel(u.id)} className="accent-indigo-500 cursor-pointer" />
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={u.name} role={u.role} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                      <p className="text-[9px] text-white/30 truncate">{u.grade||u.courses?.[0]||(u.classrooms?`${u.classrooms} rooms`:'')}</p>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-white/55 truncate">{u.email}</p>
                    <p className="text-[9px] text-white/25 truncate">{u.phone}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full w-fit"
                    style={{background:rc.bg,color:rc.color}}>{rc.emoji} {rc.label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                    <span className="text-xs font-medium" style={{color:sc.color}}>{sc.label}</span>
                  </div>
                  <div className="text-[10px] text-white/35">
                    {u.accessFrom??'07:00'} — {u.accessTo??'22:00'}
                  </div>
                  <div className="text-xs text-white/35">{u.lastSeen}</div>
                  <div className="flex items-center gap-1">
                    <button onClick={()=>setEditUser(u)} title="Edit user" className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/20 transition text-sm">✏️</button>
                    <button onClick={()=>setDelConfirm(u.id)} title="Delete user" className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition text-sm">🗑</button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filtered.length===0&&(
          <div className="py-20 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm text-white/30">No users match your filters</p>
          </div>
        )}
      </div>

      <p className="text-xs text-white/25 text-center">
        {filtered.length} of {users.length} users shown{selected.length>0&&` · ${selected.length} selected`}
      </p>

      <AnimatePresence>
        {(editUser||showAdd)&&<EditModal user={editUser??{...NEW_USER,id:Date.now()}} onSave={saveUser} onClose={()=>{setEditUser(null);setShowAdd(false)}} />}
      </AnimatePresence>

      <AnimatePresence>
        {delConfirm!==null&&(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.75)'}}>
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
              className="rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              style={{background:'#1d1668',border:'1px solid rgba(248,113,113,0.30)'}}>
              <p className="text-xl mb-1">🗑</p>
              <p className="text-lg font-black text-white mb-2">Delete this user?</p>
              <p className="text-sm text-white/45 mb-6">This action is permanent and cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={()=>setDelConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm text-white/40 border border-white/10 hover:border-white/20 transition">Cancel</button>
                <button onClick={()=>delUser(delConfirm!)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{background:'linear-gradient(135deg,#dc2626,#ef4444)',color:'#fff',boxShadow:'0 4px 16px rgba(220,38,38,0.28)'}}>
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
