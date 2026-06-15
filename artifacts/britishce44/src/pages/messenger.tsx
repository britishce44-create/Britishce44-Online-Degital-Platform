
import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGet, type Message as ApiMessage } from '@/lib/api'

/* ── types ─────────────────────────────────────────── */
interface Message { id:string; sender:string; text:string; time:string; mine:boolean; read?:boolean; channel?:string }
interface Contact  { id:string; name:string; role:string; online:boolean; unread?:number; lastMsg?:string; lastTime?:string; phone?:string; group?:string; pinned?:boolean; folder?:string }
interface Group    { id:string; name:string; color:string; contacts:string[] }
interface Folder   { id:string; name:string; emoji:string; color:string; groups:string[] }

const ROLE_COLORS: Record<string,string> = {admin:'#00ae74',teacher:'#3b82f6',student:'#38bdf8',supervisor:'#34d399',parent:'#fb923c'}

const INIT_MSGS: Record<string,Message[]> = {
  '1':[{id:'m1',sender:'Admin',text:'Good morning! Platform running smoothly.',time:'09:15',mine:false,read:true},{id:'m2',sender:'You',text:'Great! 5 live classrooms active now.',time:'09:17',mine:true,read:true}],
  '2':[{id:'m1',sender:'Suhair',text:'My class is ready for today 🎓',time:'08:30',mine:false,read:true},{id:'m2',sender:'You',text:'Excellent! Students are waiting.',time:'08:32',mine:true,read:true}],
  '3':[{id:'m1',sender:'Shihab',text:'Can you help me with exam setup?',time:'Yesterday',mine:false,read:false}],
  '4':[{id:'m1',sender:'Ahmed',text:'Teacher, question about homework.',time:'10:05',mine:false,read:false}],
  '5':[{id:'m1',sender:'Supervisor Ali',text:'Monthly report submitted ✅',time:'11:30',mine:false,read:true}],
}

const INIT_CONTACTS: Contact[] = [
  {id:'1',name:'Britishce44 Admin',role:'admin',online:true,unread:0,lastMsg:'Platform running smoothly',lastTime:'09:18',phone:'+967770000001',group:'Management',pinned:true,folder:'staff'},
  {id:'2',name:'T. Suhair Almojahid',role:'teacher',online:true,unread:0,lastMsg:'Class is ready!',lastTime:'08:32',phone:'+967770000002',group:'Teachers',folder:'staff'},
  {id:'3',name:'T. Shihab Alomary',role:'teacher',online:false,unread:1,lastMsg:'Help with exam setup?',lastTime:'Yesterday',phone:'+967770000003',group:'Teachers',folder:'staff'},
  {id:'4',name:'Ahmed Nasser',role:'student',online:true,unread:1,lastMsg:'Question about homework',lastTime:'10:05',phone:'+967770000004',group:'Class A1',folder:'students'},
  {id:'5',name:'Supervisor Ali Hassan',role:'supervisor',online:true,unread:0,lastMsg:'Report submitted',lastTime:'11:30',phone:'+967770000005',group:'Management',pinned:true,folder:'staff'},
  {id:'6',name:'Mona Alqaiti',role:'student',online:true,unread:0,lastMsg:'Thank you teacher!',lastTime:'12:00',phone:'+967770000006',group:'Class A1',folder:'students'},
  {id:'7',name:'Sara Almahdi',role:'student',online:false,unread:2,lastMsg:'When is the next class?',lastTime:'Yesterday',phone:'+967770000007',group:'Class B2',folder:'students'},
  {id:'8',name:'Hassan Almakhlafi',role:'teacher',online:true,unread:0,lastMsg:'Students are doing great',lastTime:'13:00',phone:'+967770000008',group:'Teachers',folder:'staff'},
]

const INIT_GROUPS: Group[] = [
  {id:'g1',name:'Management',color:'#00ae74',contacts:['1','5']},
  {id:'g2',name:'Teachers',color:'#60a5fa',contacts:['2','3','8']},
  {id:'g3',name:'Class A1',color:'#38bdf8',contacts:['4','6']},
  {id:'g4',name:'Class B2',color:'#34d399',contacts:['7']},
]

const INIT_FOLDERS: Folder[] = [
  {id:'f1',name:'Staff',emoji:'👥',color:'#60a5fa',groups:['g1','g2']},
  {id:'f2',name:'Students',emoji:'🎓',color:'#38bdf8',groups:['g3','g4']},
]

const CHANNELS = [
  {id:'platform',icon:'💬',label:'CE4 Platform',color:'#3b82f6'},
  {id:'whatsapp',icon:'📱',label:'WhatsApp',color:'#25d366'},
  {id:'gmail',icon:'✉️',label:'Gmail',color:'#ea4335'},
  {id:'sms',icon:'📨',label:'SMS',color:'#0891b2'},
  {id:'call',icon:'📞',label:'Voice Call',color:'#00ae74'},
]

function AvatarCircle({name,role,size='md',online}:{name:string;role:string;size?:'sm'|'md'|'lg';online?:boolean}) {
  const col=ROLE_COLORS[role]||'#6b7280'
  const sz={sm:'w-7 h-7 text-[10px]',md:'w-9 h-9 text-xs',lg:'w-11 h-11 text-sm'}
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz[size]} rounded-full flex items-center justify-center font-bold`}
        style={{background:`${col}18`,color:col,border:`1.5px solid ${col}30`}}>
        {name.charAt(0)}
      </div>
      {online!==undefined&&<div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${online?'bg-emerald-400':'bg-slate-400'}`} style={{borderColor:'#ffffff'}} />}
    </div>
  )
}

export function MessengerPage() {
  const [contacts,setContacts]=useState<Contact[]>(INIT_CONTACTS)
  const [groups]=useState<Group[]>(INIT_GROUPS)
  const [folders,setFolders]=useState<Folder[]>(INIT_FOLDERS)
  const [messages,setMessages]=useState(INIT_MSGS)
  const [activeId,setActiveId]=useState<string|null>('2')
  const [input,setInput]=useState('')
  const [channel,setChannel]=useState('platform')
  const [tab,setTab]=useState<'chats'|'contacts'|'groups'|'online'|'broadcast'>('chats')
  const [openFolder,setOpenFolder]=useState<string|null>(null)
  const [searchQ,setSearchQ]=useState('')
  const [showAddContact,setShowAddContact]=useState(false)
  const [broadcastMsg,setBroadcastMsg]=useState('')
  const [broadcastTargets,setBroadcastTargets]=useState<string[]>([])
  const [broadcastSent,setBroadcastSent]=useState(false)
  const [pinnedIds,setPinnedIds]=useState<string[]>(['1','5'])
  const msgEndRef=useRef<HTMLDivElement>(null)
  const [newContact,setNewContact]=useState({name:'',role:'student',phone:'',email:'',group:'',folder:'students'})

  useEffect(()=>{msgEndRef.current?.scrollIntoView({behavior:'smooth'})},[activeId,messages])

  // Load real system messages (assessment reminders / fan-out) — read-only thread.
  useEffect(()=>{
    apiGet<{messages:ApiMessage[]}>('/messages').then(d=>{
      if(!d.messages.length)return
      const mapped:Message[]=d.messages.map(m=>({id:`s${m.id}`,sender:m.fromName,text:m.body,time:new Date(m.createdAt).toLocaleString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}),mine:false,read:true,channel:'platform'}))
      setMessages(prev=>({...prev,sys:mapped}))
      setContacts(prev=>prev.some(c=>c.id==='sys')?prev:[{id:'sys',name:'CE4 System',role:'admin',online:true,unread:0,lastMsg:mapped[mapped.length-1]?.text.slice(0,32),lastTime:'now',group:'Management',pinned:true,folder:'staff'},...prev])
      setPinnedIds(prev=>prev.includes('sys')?prev:['sys',...prev])
    }).catch(()=>{})
  },[])

  const activeContact=contacts.find(c=>c.id===activeId)
  const currentMsgs=activeId?messages[activeId]||[]:[]
  const filteredContacts=contacts.filter(c=>c.name.toLowerCase().includes(searchQ.toLowerCase()))
  const onlineContacts=contacts.filter(c=>c.online)
  const pinned=contacts.filter(c=>pinnedIds.includes(c.id))

  const sendMsg=()=>{
    if(!input.trim()||!activeId)return
    const nm:Message={id:`m${Date.now()}`,sender:'You',text:input.trim(),time:new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}),mine:true,read:false,channel}
    setMessages(m=>({...m,[activeId]:[...(m[activeId]||[]),nm]}))
    setInput('')
  }
  const handleKey=(e:KeyboardEvent)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg()}}
  const togglePin=(id:string)=>setPinnedIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])
  const sendBroadcast=()=>{if(!broadcastMsg.trim()||!broadcastTargets.length)return;setBroadcastSent(true);setTimeout(()=>setBroadcastSent(false),3000);setBroadcastMsg('')}

  const addContact=()=>{
    if(!newContact.name)return
    const nc:Contact={id:String(Date.now()),name:newContact.name,role:newContact.role,online:false,lastMsg:'New contact',lastTime:'Now',phone:newContact.phone,group:newContact.group,folder:newContact.folder}
    setContacts(p=>[...p,nc])
    setShowAddContact(false)
    setNewContact({name:'',role:'student',phone:'',email:'',group:'',folder:'students'})
  }

  const inpCls="w-full rounded-xl px-3 py-2 text-sm text-[#150d79] outline-none bg-[#f1f5f9] border border-slate-200 focus:border-[#3FBAEB] placeholder-slate-400 transition"
  const activeChan=CHANNELS.find(c=>c.id===channel)

  return (
    <div className="animate-fade-in h-[calc(100vh-120px)] flex gap-3 min-h-0">

      {/* ── LEFT PANEL: Contacts/Groups/Folders ─── */}
      <div className="w-72 flex-shrink-0 flex flex-col rounded-2xl overflow-hidden"
        style={{background:'#ffffff',border:'1px solid rgba(21,13,121,0.08)',boxShadow:'0 1px 3px rgba(21,13,121,0.06)'}}>

        {/* Header */}
        <div className="px-4 pt-4 pb-3" style={{borderBottom:'1px solid rgba(21,13,121,0.08)'}}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-[#150d79]">💬 CE4 Messenger</h3>
            <button onClick={()=>setShowAddContact(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition hover:bg-indigo-500/20 text-indigo-400">＋</button>
          </div>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="🔍 Search…"
            className="w-full px-3 py-2 rounded-xl text-xs outline-none placeholder-slate-400"
            style={{background:'#f1f5f9',border:'1px solid #e2e8f0',color:'#150d79'}} />

          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            {([['chats','💬'],['contacts','👤'],['groups','👥'],['online','🟢'],['broadcast','📢']] as const).map(([t,icon])=>(
              <button key={t} onClick={()=>setTab(t)}
                className="flex-1 py-1 rounded-lg text-[9px] font-bold uppercase transition"
                style={{background:tab===t?'rgba(63, 186, 235,0.18)':'transparent',color:tab===t?'#150d79':'#94a3b8'}}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Pinned */}
        {tab==='chats'&&pinned.length>0&&(
          <div className="px-3 pt-3 pb-1">
            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 px-1">📌 Pinned</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {pinned.map(c=>(
                <button key={c.id} onClick={()=>setActiveId(c.id)}
                  className="flex flex-col items-center gap-1 flex-shrink-0">
                  <AvatarCircle name={c.name} role={c.role} size="sm" online={c.online} />
                  <p className="text-[8px] text-slate-500 w-10 text-center truncate">{c.name.split(' ')[0]}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* List area */}
        <div className="flex-1 overflow-y-auto">
          {/* CHATS tab */}
          {tab==='chats'&&filteredContacts.map(c=>{
            const col=ROLE_COLORS[c.role]||'#6b7280'
            return (
              <div key={c.id} onClick={()=>setActiveId(c.id)}
                className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition hover:bg-slate-50 group"
                style={{background:activeId===c.id?'rgba(63, 186, 235,0.12)':undefined}}>
                <AvatarCircle name={c.name} role={c.role} online={c.online} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#150d79] truncate">{c.name}</p>
                    <p className="text-[9px] text-slate-400 flex-shrink-0 ml-1">{c.lastTime}</p>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{c.lastMsg}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {(c.unread??0)>0&&<span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{background:'#3b82f6'}}>{c.unread}</span>}
                  <button onClick={e=>{e.stopPropagation();togglePin(c.id)}} className="opacity-0 group-hover:opacity-100 text-[9px] transition"
                    style={{color:pinnedIds.includes(c.id)?'#00ae74':'#94a3b8'}}>📌</button>
                </div>
              </div>
            )
          })}

          {/* CONTACTS tab */}
          {tab==='contacts'&&(
            <div>
              {/* Folders */}
              {folders.map(f=>{
                const isOpen=openFolder===f.id
                const fGroups=groups.filter(g=>f.groups.includes(g.id))
                const fContacts=contacts.filter(c=>fGroups.some(g=>g.contacts.includes(c.id)))
                return (
                  <div key={f.id}>
                    <button onClick={()=>setOpenFolder(isOpen?null:f.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 transition">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                        style={{background:`${f.color}18`,border:`1px solid ${f.color}25`}}>{f.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#150d79]">{f.name}</p>
                        <p className="text-[9px] text-slate-500">{fContacts.length} contacts</p>
                      </div>
                      <span className="text-slate-400 text-xs">{isOpen?'▼':'▶'}</span>
                    </button>
                    <AnimatePresence>
                      {isOpen&&(
                        <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}>
                          {fContacts.map(c=>(
                            <div key={c.id} onClick={()=>{setActiveId(c.id);setTab('chats')}}
                              className="flex items-center gap-2.5 pl-6 pr-3 py-2 cursor-pointer hover:bg-slate-50 transition">
                              <AvatarCircle name={c.name} role={c.role} size="sm" online={c.online} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[#150d79] truncate">{c.name}</p>
                                <p className="text-[9px] text-slate-400 truncate">{c.phone}</p>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}

          {/* GROUPS tab */}
          {tab==='groups'&&groups.map(g=>(
            <div key={g.id} className="px-3 py-2.5">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black"
                  style={{background:`${g.color}18`,color:g.color,border:`1px solid ${g.color}25`}}>{g.contacts.length}</div>
                <div>
                  <p className="text-xs font-bold text-[#150d79]">{g.name}</p>
                  <p className="text-[9px] text-slate-500">{g.contacts.length} members</p>
                </div>
                <button onClick={()=>{setBroadcastTargets(g.contacts);setTab('broadcast')}}
                  className="ml-auto text-[9px] px-2 py-1 rounded-full font-semibold"
                  style={{background:'rgba(63, 186, 235,0.15)',color:'#2620a8'}}>Message all</button>
              </div>
            </div>
          ))}

          {/* ONLINE tab */}
          {tab==='online'&&(
            <div>
              <div className="px-3 py-2 flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#00AE74]">🟢 Online Now — {onlineContacts.length}</p>
              </div>
              {onlineContacts.map(c=>(
                <div key={c.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 transition cursor-pointer"
                  onClick={()=>{setActiveId(c.id);setTab('chats')}}>
                  <AvatarCircle name={c.name} role={c.role} online={true} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#150d79] truncate">{c.name}</p>
                    <p className="text-[9px] text-[#00AE74]">Active now</p>
                  </div>
                  <button onClick={e=>{e.stopPropagation();togglePin(c.id)}}
                    className="text-[9px] transition" style={{color:pinnedIds.includes(c.id)?'#00ae74':'#94a3b8'}}>📌</button>
                </div>
              ))}
              {contacts.filter(c=>!c.online).length>0&&(
                <>
                  <div className="px-3 pt-3 pb-1"><p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">⚫ Offline</p></div>
                  {contacts.filter(c=>!c.online).map(c=>(
                    <div key={c.id} className="flex items-center gap-2.5 px-3 py-2 opacity-60 hover:opacity-90 transition cursor-pointer"
                      onClick={()=>{setActiveId(c.id);setTab('chats')}}>
                      <AvatarCircle name={c.name} role={c.role} online={false} />
                      <p className="text-xs text-slate-600 truncate">{c.name}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* BROADCAST tab */}
          {tab==='broadcast'&&(
            <div className="p-3 space-y-3">
              <p className="text-xs font-bold text-[#150d79]">📢 Broadcast Message</p>
              <p className="text-[9px] text-slate-500">Select recipients, choose channel, write message, send.</p>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-1.5">Select Recipients</p>
                {contacts.map(c=>(
                  <div key={c.id} className="flex items-center gap-2 py-1.5 cursor-pointer" onClick={()=>setBroadcastTargets(t=>t.includes(c.id)?t.filter(x=>x!==c.id):[...t,c.id])}>
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0`}
                      style={{background:broadcastTargets.includes(c.id)?'#3b82f6':'#f1f5f9',border:`1px solid ${broadcastTargets.includes(c.id)?'#3b82f6':'#cbd5e1'}`}}>
                      {broadcastTargets.includes(c.id)&&<span className="text-[7px] text-white font-black">✓</span>}
                    </div>
                    <AvatarCircle name={c.name} role={c.role} size="sm" />
                    <p className="text-[10px] text-slate-700 truncate">{c.name}</p>
                  </div>
                ))}
              </div>
              <textarea value={broadcastMsg} onChange={e=>setBroadcastMsg(e.target.value)}
                rows={3} placeholder="Type broadcast message…"
                className="w-full rounded-xl px-3 py-2 text-xs text-[#150d79] outline-none resize-none placeholder-slate-400"
                style={{background:'#f1f5f9',border:'1px solid #e2e8f0'}} />
              <button onClick={sendBroadcast} disabled={broadcastSent}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition"
                style={{background:broadcastSent?'rgba(0,174,116,0.18)':'linear-gradient(135deg,#2620a8,#3FBAEB)',color:broadcastSent?'#00684a':'#fff'}}>
                {broadcastSent?'✅ Sent!':'📢 Send Broadcast'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── CENTER PANEL: Chat ─────────────────── */}
      <div className="flex-1 flex flex-col rounded-2xl overflow-hidden min-w-0"
        style={{background:'#ffffff',border:'1px solid rgba(21,13,121,0.08)',boxShadow:'0 1px 3px rgba(21,13,121,0.06)'}}>

        {activeContact ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{borderBottom:'1px solid rgba(21,13,121,0.08)'}}>
              <AvatarCircle name={activeContact.name} role={activeContact.role} size="lg" online={activeContact.online} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#150d79]">{activeContact.name}</p>
                <p className="text-[10px]" style={{color:activeContact.online?'#00AE74':'#94a3b8'}}>{activeContact.online?'Active now':'Offline'}</p>
              </div>
              {/* Channel selector */}
              <div className="flex gap-1.5">
                {CHANNELS.map(c=>(
                  <button key={c.id} onClick={()=>setChannel(c.id)} title={c.label}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition"
                    style={{background:channel===c.id?`${c.color}25`:'#f1f5f9',border:`1px solid ${channel===c.id?c.color+'50':'#e2e8f0'}`,transform:channel===c.id?'scale(1.1)':undefined}}>
                    {c.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Channel indicator */}
            {activeChan&&<div className="px-4 py-1.5 flex-shrink-0" style={{background:`${activeChan.color}12`,borderBottom:'1px solid rgba(21,13,121,0.06)'}}>
              <p className="text-[9px] font-semibold" style={{color:activeChan.color}}>
                {activeChan.icon} Sending via {activeChan.label}{channel!=='platform'&&' — requires external app integration'}
              </p>
            </div>}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {currentMsgs.map(m=>(
                <div key={m.id} className={`flex ${m.mine?'justify-end':'justify-start'}`}>
                  {!m.mine&&<AvatarCircle name={activeContact.name} role={activeContact.role} size="sm" />}
                  <div className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 mx-2`}
                    style={{background:m.mine?'linear-gradient(135deg,#2620a8,#3FBAEB)':'#eef2ff',border:m.mine?'none':'1px solid #e2e8f0'}}>
                    <p className={`text-sm leading-snug ${m.mine?'text-white':'text-[#150d79]'}`}>{m.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <p className={`text-[8px] ${m.mine?'text-white/70':'text-slate-400'}`}>{m.time}</p>
                      {m.mine&&<span className="text-[8px] text-white/70">{m.read?'✓✓':'✓'}</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={msgEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-4 py-3 flex gap-3 items-end"
              style={{borderTop:'1px solid rgba(21,13,121,0.08)'}}>
              <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
                rows={1} placeholder={`Message via ${activeChan?.label||'CE4'}…`}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm text-[#150d79] outline-none resize-none leading-snug placeholder-slate-400"
                style={{background:'#f1f5f9',border:'1px solid #e2e8f0',maxHeight:'100px'}} />
              <button onClick={sendMsg}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition"
                style={{background:input.trim()?'linear-gradient(135deg,#2620a8,#3FBAEB)':'#f1f5f9',color:input.trim()?'#fff':'#94a3b8',boxShadow:input.trim()?'0 4px 16px rgba(63, 186, 235,0.30)':undefined}}>
                ➤
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <p className="text-5xl mb-4">💬</p>
            <p className="text-lg font-black text-[#150d79]">Select a conversation</p>
            <p className="text-sm text-slate-400 mt-1">Choose a contact from the left panel to start chatting</p>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL: Active / Actions ─────── */}
      <div className="w-60 flex-shrink-0 flex flex-col gap-3">
        {/* Online now widget */}
        <div className="rounded-2xl overflow-hidden flex-shrink-0"
          style={{background:'#ffffff',border:'1px solid rgba(21,13,121,0.08)',boxShadow:'0 1px 3px rgba(21,13,121,0.06)'}}>
          <div className="px-4 py-3" style={{borderBottom:'1px solid rgba(21,13,121,0.08)'}}>
            <p className="text-xs font-black text-[#150d79]">🟢 Online Now</p>
            <p className="text-[9px] text-[#00AE74]">{onlineContacts.length} active users</p>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {onlineContacts.map(c=>(
              <div key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition cursor-pointer"
                onClick={()=>setActiveId(c.id)}>
                <AvatarCircle name={c.name} role={c.role} size="sm" online={true} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-[#150d79] truncate">{c.name}</p>
                </div>
                <button onClick={e=>{e.stopPropagation();togglePin(c.id)}} className="text-[9px]"
                  style={{color:pinnedIds.includes(c.id)?'#00ae74':'#94a3b8'}}>📌</button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl p-4 flex-shrink-0 space-y-2"
          style={{background:'#ffffff',border:'1px solid rgba(21,13,121,0.08)',boxShadow:'0 1px 3px rgba(21,13,121,0.06)'}}>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Quick Actions</p>
          {[
            {icon:'📥',label:'Import Contacts',color:'#3b82f6'},
            {icon:'📤',label:'Export Contacts',color:'#00ae74'},
            {icon:'👥',label:'Create Group',color:'#2563eb'},
            {icon:'📁',label:'New Folder',color:'#00ae74'},
            {icon:'📢',label:'Broadcast All',color:'#e11d48'},
          ].map(a=>(
            <button key={a.label} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition hover:-translate-y-0.5"
              onClick={()=>{if(a.label==='Broadcast All'){setBroadcastTargets(contacts.map(c=>c.id));setTab('broadcast')}}}
              style={{background:`${a.color}0e`,border:`1px solid ${a.color}18`,color:a.color}}>
              <span className="text-sm">{a.icon}</span>
              <span className="text-[11px] font-semibold">{a.label}</span>
            </button>
          ))}
        </div>

        {/* Channels status */}
        <div className="rounded-2xl p-4 flex-1 overflow-y-auto"
          style={{background:'#ffffff',border:'1px solid rgba(21,13,121,0.08)',boxShadow:'0 1px 3px rgba(21,13,121,0.06)'}}>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Channels</p>
          {CHANNELS.map(c=>(
            <div key={c.id} className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{background:`${c.color}15`,border:`1px solid ${c.color}25`}}>{c.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-slate-700">{c.label}</p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full" style={{background:c.id==='platform'?'#00AE74':'#cbd5e1'}} />
            </div>
          ))}
        </div>
      </div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddContact&&(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(15,12,60,0.45)',backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)'}}>
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
              className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
              style={{background:'#ffffff',border:'1px solid #e2e8f0'}}>
              <div className="h-0.5 bg-gradient-to-r from-[#150d79] to-[#3FBAEB]" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-[#150d79]">➕ Add Contact</h3>
                  <button onClick={()=>setShowAddContact(false)} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
                </div>
                <div className="space-y-3">
                  {([['name','Full Name','text'],['phone','Phone / WhatsApp','tel'],['email','Email','email'],['group','Group (optional)','text']] as const).map(([k,ph,t])=>(
                    <input key={k} type={t} placeholder={ph} value={(newContact as any)[k]} onChange={e=>setNewContact(p=>({...p,[k]:e.target.value}))} className={inpCls} />
                  ))}
                  <select value={newContact.role} onChange={e=>setNewContact(p=>({...p,role:e.target.value}))} className={`${inpCls} bg-[#ffffff]`}>
                    <option value="student">🎓 Student</option><option value="teacher">👩‍🏫 Teacher</option>
                    <option value="parent">👪 Parent</option><option value="admin">👑 Admin</option>
                  </select>
                  <select value={newContact.folder} onChange={e=>setNewContact(p=>({...p,folder:e.target.value}))} className={`${inpCls} bg-[#ffffff]`}>
                    <option value="staff">👥 Staff Folder</option><option value="students">🎓 Students Folder</option>
                  </select>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={()=>setShowAddContact(false)} className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 border border-slate-200 hover:bg-slate-50">Cancel</button>
                  <button onClick={addContact}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                    style={{background:'linear-gradient(135deg,#150d79,#2620a8)',color:'#fff'}}>
                    Add Contact
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
