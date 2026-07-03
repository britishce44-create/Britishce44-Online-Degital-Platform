import { useEffect, useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from '@/lib/api'

interface Group { id: number; name: string; color: string }
interface Contact { id: number; name: string; phone: string; email: string; groupIds: number[]; classification: string; notes: string }
interface ContactMsg { id: number; channel: string; direction: string; content: string; status: string; senderInfo: string; createdAt: string }

const CHANNELS = [
  { key: 'whatsapp', icon: '💬', label: 'WhatsApp', color: '#25D366' },
  { key: 'sms', icon: '📱', label: 'SMS', color: '#3b82f6' },
  { key: 'email', icon: '📧', label: 'Gmail', color: '#ea4335' },
  { key: 'messenger', icon: '✉️', label: 'Messenger', color: '#8b5cf6' },
  { key: 'call', icon: '📞', label: 'Call', color: '#059669' },
]

const CLASSIFICATIONS = ['Student', 'Teacher', 'Parent', 'Staff', 'Vendor', 'Other']

function ContactModal({ contact, groups, onSave, onClose }: {
  contact?: Contact | null; groups: Group[]; onSave: () => void; onClose: () => void
}) {
  const [name, setName] = useState(contact?.name ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [groupIds, setGroupIds] = useState<number[]>(contact?.groupIds ?? [])
  const [classification, setClassification] = useState(contact?.classification ?? '')
  const [notes, setNotes] = useState(contact?.notes ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const isNew = !contact

  const toggleGroup = (id: number) => setGroupIds(g => g.includes(id) ? g.filter(x => x !== id) : [...g, id])

  const handleSave = async () => {
    if (!name.trim()) { setErr('Name required'); return }
    setBusy(true); setErr('')
    try {
      const body = { name: name.trim(), phone, email, groupIds, classification, notes }
      if (isNew) await apiPost('/contacts', body)
      else await apiPatch(`/contacts/${contact!.id}`, body)
      onSave()
    } catch (e) { setErr(e instanceof ApiError ? e.message : 'Save failed') }
    finally { setBusy(false) }
  }

  const inp = "w-full rounded-lg px-3.5 py-2.5 text-sm text-gray-900 bg-white border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none placeholder:text-gray-400 transition"
  const label = "block text-xs font-semibold text-blue-800 mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-2xl overflow-auto shadow-2xl bg-white max-h-[90vh]">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 to-blue-400" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-blue-900">{isNew ? '➕ Add Contact' : '✏️ Edit Contact'}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full text-blue-400 hover:bg-blue-50 hover:text-blue-700 transition">✕</button>
          </div>
          {err && <div className="mb-4 px-4 py-2 rounded-xl text-sm bg-red-50 text-red-600 border border-red-200">{err}</div>}
          <div className="space-y-4">
            <div>
              <label className={label}>Full Name *</label>
              <input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Contact name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Phone</label>
                <input className={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+967 7XX XXX XXX" />
              </div>
              <div>
                <label className={label}>Email</label>
                <input className={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Classification</label>
                <select className={inp} value={classification} onChange={e => setClassification(e.target.value)}>
                  <option value="">None</option>
                  {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Groups</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {groups.map(g => {
                    const on = groupIds.includes(g.id)
                    return (
                      <button key={g.id} onClick={() => toggleGroup(g.id)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium border transition ${on ? 'text-white' : 'text-gray-500 border-gray-200 hover:border-blue-300'}`}
                        style={on ? { background: g.color, borderColor: g.color, color: '#fff' } : {}}>
                        {g.name}
                      </button>
                    )
                  })}
                  {groups.length === 0 && <span className="text-xs text-gray-400">No groups yet</span>}
                </div>
              </div>
            </div>
            <div>
              <label className={label}>Notes</label>
              <textarea className={inp + ' resize-none'} rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition">Cancel</button>
            <button onClick={handleSave} disabled={busy}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
              {busy ? 'Saving…' : isNew ? '➕ Add' : '💾 Save'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function SendMessageModal({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const [channel, setChannel] = useState('whatsapp')
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [msgHistory, setMsgHistory] = useState<ContactMsg[]>([])

  useEffect(() => {
    apiGet<{ messages: ContactMsg[] }>(`/contacts/${contact.id}/messages`).then(r => setMsgHistory(r.messages)).catch(() => {})
  }, [contact.id])

  const send = async () => {
    if (!content.trim()) return
    setBusy(true); setResult(null)
    try {
      const r = await apiPost<{ ok: boolean; status: string; senderInfo: string; contactName: string }>('/contacts/send', { contactId: contact.id, channel, content })
      setResult(`✅ Sent via ${channel} (${r.status})`)
      setContent('')
      const msgs = await apiGet<{ messages: ContactMsg[] }>(`/contacts/${contact.id}/messages`)
      setMsgHistory(msgs.messages)
    } catch (e) { setResult(`❌ Failed: ${e instanceof ApiError ? e.message : 'Error'}`) }
    finally { setBusy(false) }
  }

  const ch = CHANNELS.find(c => c.key === channel)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl bg-white max-h-[90vh] flex flex-col">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 to-blue-400" />
        <div className="p-5 border-b border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-blue-900">📨 Send Message</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full text-blue-400 hover:bg-blue-50 transition">✕</button>
          </div>
          <p className="text-sm text-blue-500">To: <strong>{contact.name}</strong> {contact.phone && `· ${contact.phone}`}{contact.email && `· ${contact.email}`}</p>
        </div>
        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          {/* Channel selector */}
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map(c => (
              <button key={c.key} onClick={() => setChannel(c.key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition border"
                style={channel === c.key ? { background: c.color, color: '#fff', borderColor: c.color } : { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          {/* Channel-specific sender info */}
          <div className="text-xs bg-blue-50 rounded-xl px-3 py-2 text-blue-700 border border-blue-100">
            Sending via <strong>{ch?.label}</strong>
            {channel === 'whatsapp' && <span> from <strong>00967783226233</strong></span>}
            {channel === 'sms' && <span> from <strong>00967783226233 (Yemen Mobile)</strong></span>}
            {channel === 'email' && <span> from <strong>britishce44@gmail.com</strong></span>}
            {channel === 'messenger' && <span> via <strong>CE4 Messenger</strong></span>}
            {channel === 'call' && <span> to <strong>{contact.phone || '—'}</strong></span>}
          </div>

          {/* Content */}
          {channel !== 'call' && (
            <>
              <textarea className="w-full rounded-xl px-4 py-3 text-sm text-gray-800 bg-white border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none" rows={4}
                value={content} onChange={e => setContent(e.target.value)} placeholder="Type your message…" />
              <button onClick={send} disabled={busy || !content.trim()}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
                style={{ background: ch?.color || '#2563eb', boxShadow: `0 4px 14px ${ch?.color}40` }}>
                {busy ? 'Sending…' : `${ch?.icon} Send via ${ch?.label}`}
              </button>
            </>
          )}
          {channel === 'call' && (
            <div className="text-center py-4">
              <p className="text-lg mb-2">📞</p>
              <p className="text-sm text-gray-600">Initiate a call to <strong>{contact.phone || contact.name}</strong></p>
              <p className="text-xs text-gray-400 mt-1">Call logged for tracking</p>
              <button onClick={send} disabled={busy}
                className="mt-3 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition bg-emerald-600 hover:bg-emerald-700 shadow-lg">
                📞 Log Call
              </button>
            </div>
          )}

          {result && <div className={`text-xs px-3 py-2 rounded-lg ${result.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{result}</div>}

          {/* Message history */}
          {msgHistory.length > 0 && (
            <div className="border-t border-blue-100 pt-3 mt-2">
              <p className="text-xs font-semibold text-blue-700 mb-2">📜 Recent Messages</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {msgHistory.slice(0, 10).map(m => {
                  const chn = CHANNELS.find(c => c.key === m.channel)
                  return (
                    <div key={m.id} className="text-xs bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      <span className="font-medium text-gray-700">{chn?.icon} {chn?.label}</span>
                      <span className={`ml-2 text-[10px] font-medium ${m.status === 'sent' ? 'text-emerald-600' : 'text-red-500'}`}>{m.status}</span>
                      <p className="text-gray-600 mt-0.5 truncate">{m.content}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{new Date(m.createdAt).toLocaleString()}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export function ContactsManager() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<number | null>(null)
  const [classFilter, setClassFilter] = useState('')
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [sendContact, setSendContact] = useState<Contact | null>(null)
  const [delId, setDelId] = useState<number | null>(null)
  const [showGroupManager, setShowGroupManager] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [c, g] = await Promise.all([
        apiGet<{ contacts: Contact[] }>('/contacts'),
        apiGet<{ groups: Group[] }>('/contacts/groups'),
      ])
      setContacts(c.contacts); setGroups(g.groups)
    } catch { setMsg({ kind: 'err', text: 'Failed to load contacts' }) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => contacts.filter(c => {
    const q = search.toLowerCase()
    return (c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)) || (c.email && c.email.toLowerCase().includes(q)))
      && (!groupFilter || (c.groupIds ?? []).includes(groupFilter))
      && (!classFilter || c.classification === classFilter)
  }), [contacts, search, groupFilter, classFilter])

  const delContact = async (id: number) => {
    try { await apiDelete(`/contacts/${id}`); setContacts(p => p.filter(c => c.id !== id)); setMsg({ kind: 'ok', text: 'Contact deleted' }) }
    catch { setMsg({ kind: 'err', text: 'Delete failed' }) }
    setDelId(null)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
    const items: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
      const item: any = {}
      headers.forEach((h, idx) => { item[h] = vals[idx] || '' })
      if (item.name) items.push(item)
    }
    if (items.length) {
      await apiPost('/contacts/import', { items })
      await load()
      setMsg({ kind: 'ok', text: `${items.length} contacts imported` })
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleExport = async () => {
    const r = await apiGet<Blob>('/contacts/export', { headers: { Accept: 'text/csv' } } as any)
    const url = URL.createObjectURL(new Blob([r as any], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = 'contacts.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const classifications = [...new Set(contacts.map(c => c.classification).filter(Boolean))] as string[]

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${msg.kind === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="ml-2 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>➕ Add Contact</button>
          <button onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-xl text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition">📥 Import CSV</button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <button onClick={handleExport} className="px-3 py-2 rounded-xl text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition">📤 Export CSV</button>
          <button onClick={() => setShowGroupManager(!showGroupManager)} className="px-3 py-2 rounded-xl text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition">
            {showGroupManager ? '✕ Close Groups' : '🏷️ Groups'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-400">{contacts.length} contacts</span>
          <button onClick={load} className="text-xs px-3 py-1.5 rounded-lg text-blue-500 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition">↻</button>
        </div>
      </div>

      {/* Group Manager panel */}
      <AnimatePresence>
        {showGroupManager && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl bg-white border border-blue-100 shadow-sm">
            <div className="p-4">
              <p className="text-sm font-bold text-blue-900 mb-3">🏷️ Manage Groups</p>
              <GroupManager groups={groups} onUpdate={load} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts…"
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none bg-white border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-800" />
        </div>
        <select value={groupFilter ?? ''} onChange={e => setGroupFilter(e.target.value ? Number(e.target.value) : null)}
          className="px-3 py-2 rounded-xl text-sm outline-none bg-white border border-blue-200 text-gray-700">
          <option value="">All Groups</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none bg-white border border-blue-200 text-gray-700">
          <option value="">All Classifications</option>
          {classifications.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Contact cards */}
      {loading ? (
        <div className="py-12 text-center text-sm text-blue-400">Loading contacts…</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-blue-300">No contacts found</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {filtered.map(c => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-xl bg-white border border-blue-100 shadow-sm hover:shadow-md transition p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">{c.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                      <p className="text-xs text-blue-400">{c.classification || '—'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditContact(c)} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-50 transition text-xs">✏️</button>
                    <button onClick={() => setDelId(c.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition text-xs">🗑️</button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-500 mb-3">
                  {c.phone && <p>📱 {c.phone}</p>}
                  {c.email && <p>📧 {c.email}</p>}
                </div>
                {c.groupIds && c.groupIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {c.groupIds.map(gid => {
                      const g = groups.find(gr => gr.id === gid)
                      return g ? <span key={gid} className="text-[9px] px-2 py-0.5 rounded-full font-medium text-white" style={{ background: g.color }}>{g.name}</span> : null
                    })}
                  </div>
                )}
                {c.notes && <p className="text-[10px] text-gray-400 italic mb-3">"{c.notes}"</p>}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-blue-50">
                  {CHANNELS.map(ch => (
                    <button key={ch.key} onClick={() => setSendContact(c)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition border"
                      style={{ borderColor: '#e2e8f0', color: '#64748b' }}
                      onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = ch.color; (e.target as HTMLElement).style.color = ch.color }}
                      onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#e2e8f0'; (e.target as HTMLElement).style.color = '#64748b' }}>
                      {ch.icon}
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <p className="text-xs text-blue-300 text-center">{filtered.length} of {contacts.length} contacts</p>

      {/* Modals */}
      <AnimatePresence>
        {(editContact || showAdd) && (
          <ContactModal contact={editContact} groups={groups} onSave={() => { load(); setEditContact(null); setShowAdd(false); setMsg({ kind: 'ok', text: 'Contact saved' }) }} onClose={() => { setEditContact(null); setShowAdd(false) }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sendContact && <SendMessageModal contact={sendContact} onClose={() => setSendContact(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {delId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl p-6 max-w-sm w-full shadow-2xl bg-white border border-red-200">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">🗑️</div>
              <p className="text-lg font-bold text-gray-900 mb-2 text-center">Delete Contact</p>
              <p className="text-sm text-gray-500 text-center mb-5">Are you sure you want to delete this contact?</p>
              <div className="flex gap-3">
                <button onClick={() => setDelId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition">Cancel</button>
                <button onClick={() => delContact(delId!)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-lg">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Group Manager Inline ─── */
function GroupManager({ groups, onUpdate }: { groups: Group[]; onUpdate: () => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  const addGroup = async () => {
    if (!name.trim()) return
    await apiPost('/contacts/groups', { name: name.trim(), color })
    setName(''); onUpdate()
  }

  const updateGroup = async (id: number) => {
    if (!editName.trim()) return
    await apiPatch(`/contacts/groups/${id}`, { name: editName.trim() })
    setEditId(null); onUpdate()
  }

  const deleteGroup = async (id: number) => {
    await apiDelete(`/contacts/groups/${id}`)
    onUpdate()
  }

  const colors = ['#3b82f6','#ef4444','#22c55e','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316']

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Group name…"
          className="flex-1 px-3 py-2 rounded-lg text-sm bg-white border border-blue-200 focus:border-blue-500 outline-none" />
        <div className="flex gap-1">
          {colors.map(c => (
            <button key={c} onClick={() => setColor(c)} className="w-6 h-6 rounded-full border-2 transition" style={{ background: c, borderColor: color === c ? '#1e293b' : 'transparent' }} />
          ))}
        </div>
        <button onClick={addGroup} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition">Add</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {groups.map(g => (
          <div key={g.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white" style={{ background: g.color }}>
            {editId === g.id ? (
              <input value={editName} onChange={e => setEditName(e.target.value)} onBlur={() => updateGroup(g.id)} onKeyDown={e => e.key === 'Enter' && updateGroup(g.id)}
                className="w-20 bg-transparent outline-none border-b border-white/50 text-white text-xs" autoFocus />
            ) : (
              <span onClick={() => { setEditId(g.id); setEditName(g.name) }} className="cursor-pointer">{g.name}</span>
            )}
            <button onClick={() => deleteGroup(g.id)} className="opacity-60 hover:opacity-100 text-[10px]">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
