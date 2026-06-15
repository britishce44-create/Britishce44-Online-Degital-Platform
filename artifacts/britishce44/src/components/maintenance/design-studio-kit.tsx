import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMaintenanceMode } from './maintenance-provider'

type KitTab = 'theme' | 'typography' | 'layout' | 'components' | 'templates' | 'ai' | 'code' | 'deploy'

const FONT_OPTIONS = [
  'Inter, sans-serif', 'Poppins, sans-serif', 'Raleway, sans-serif',
  'Playfair Display, serif', 'DM Sans, sans-serif', 'Space Grotesk, sans-serif',
  'Outfit, sans-serif', 'Nunito, sans-serif', 'Lato, sans-serif',
  'Roboto, sans-serif', 'Montserrat, sans-serif', 'Geist, sans-serif',
]

const RADIUS_OPTIONS = [
  { label: 'Sharp', value: '0rem' },
  { label: 'Subtle', value: '0.375rem' },
  { label: 'Rounded', value: '0.75rem' },
  { label: 'More', value: '1rem' },
  { label: 'Full', value: '1.5rem' },
]

const PRESET_THEMES = [
  {
    name: 'Space Navy', icon: '🌌',
    theme: { '--navy': '#1d1668', '--gold': '#00ae74', '--royal-blue': '#2a2196', '--accent-indigo': '#3b82f6', '--accent-violet': '#2563eb' }
  },
  {
    name: 'Emerald Elite', icon: '💎',
    theme: { '--navy': '#042f2e', '--gold': '#34d399', '--royal-blue': '#00684a', '--accent-indigo': '#00ae74', '--accent-violet': '#00ae74' }
  },
  {
    name: 'Royal Crimson', icon: '👑',
    theme: { '--navy': '#1c0a00', '--gold': '#f59e0b', '--royal-blue': '#450a0a', '--accent-indigo': '#dc2626', '--accent-violet': '#b91c1c' }
  },
  {
    name: 'Ocean Blue', icon: '🌊',
    theme: { '--navy': '#241c80', '--gold': '#38bdf8', '--royal-blue': '#1e3a8a', '--accent-indigo': '#3b82f6', '--accent-violet': '#0ea5e9' }
  },
  {
    name: 'Midnight Violet', icon: '🔮',
    theme: { '--navy': '#150529', '--gold': '#c084fc', '--royal-blue': '#2e1065', '--accent-indigo': '#2563eb', '--accent-violet': '#9333ea' }
  },
  {
    name: 'Golden Hour', icon: '🌅',
    theme: { '--navy': '#1c0f00', '--gold': '#fbbf24', '--royal-blue': '#422006', '--accent-indigo': '#d97706', '--accent-violet': '#f59e0b' }
  },
]

const COMPONENT_TEMPLATES = [
  { icon: '📊', name: 'Stats Grid', desc: '4-column metric cards with trend indicators' },
  { icon: '📋', name: 'Data Table', desc: 'Sortable table with filters and pagination' },
  { icon: '📈', name: 'Analytics Panel', desc: 'Chart + KPI summary with date range' },
  { icon: '💬', name: 'Chat Widget', desc: 'Real-time message thread component' },
  { icon: '🏆', name: 'Leaderboard', desc: 'Ranked student performance board' },
  { icon: '📅', name: 'Calendar', desc: 'Monthly view with event markers' },
  { icon: '🔔', name: 'Alerts Feed', desc: 'Notification stream with priority tags' },
  { icon: '🎯', name: 'Progress Tracker', desc: 'Goal completion bars with milestones' },
  { icon: '👤', name: 'Profile Card', desc: 'User card with avatar, stats, actions' },
  { icon: '🗂', name: 'Kanban Board', desc: 'Drag-drop task columns' },
  { icon: '🎓', name: 'Course Card', desc: 'Course tile with progress ring' },
  { icon: '⚡', name: 'Quick Actions', desc: 'Grid of shortcut action buttons' },
]

const PAGE_TEMPLATES = [
  { icon: '🏠', name: 'Admin Dashboard', desc: 'Full admin overview with stats, charts, alerts' },
  { icon: '👩‍🏫', name: 'Teacher Portal', desc: 'Class schedule + student performance' },
  { icon: '🎓', name: 'Student Home', desc: 'My courses, upcoming tests, homework' },
  { icon: '📊', name: 'Analytics Hub', desc: 'Deep-dive data visualization page' },
  { icon: '🏫', name: 'Virtual Campus', desc: '3D grid of classroom doors with status' },
  { icon: '📝', name: 'Exam Hall', desc: 'Full-screen exam with timer and anti-cheat' },
]

const AI_SUGGESTIONS = [
  { icon: '🎨', title: 'Add gradient hero section', desc: 'Vibrant top banner with platform stats and quick actions' },
  { icon: '✨', title: 'Glass morphism cards', desc: 'Replace flat cards with frosted glass panels' },
  { icon: '📱', title: 'Improve mobile layout', desc: 'Bottom nav bar for mobile students' },
  { icon: '🌙', title: 'Auto dark mode', desc: 'System-preference dark/light toggle in settings' },
  { icon: '🏃', title: 'Faster transitions', desc: 'Micro-animations on all page navigations' },
  { icon: '🎯', title: 'Sticky progress bar', desc: 'Always-visible course completion indicator' },
  { icon: '🔔', title: 'Notification center', desc: 'Slide-out drawer for all platform alerts' },
  { icon: '📊', title: 'Live dashboard widgets', desc: 'Real-time counters for active classrooms' },
]

const COLOR_VARS: { key: string; label: string; desc: string }[] = [
  { key: '--navy', label: 'Primary Dark', desc: 'Main background & headers' },
  { key: '--gold', label: 'Brand Gold', desc: 'Primary accent & highlights' },
  { key: '--royal-blue', label: 'Surface Dark', desc: 'Sidebar & elevated surfaces' },
  { key: '--champagne', label: 'Light Surface', desc: 'Cards & light backgrounds' },
  { key: '--accent-indigo', label: 'Electric Indigo', desc: 'Active states & links' },
  { key: '--accent-violet', label: 'Violet', desc: 'Secondary accent' },
  { key: '--accent-emerald', label: 'Emerald', desc: 'Success & positive states' },
  { key: '--accent-rose', label: 'Rose', desc: 'Alerts & important actions' },
  { key: '--accent-cyan', label: 'Cyan', desc: 'Info states & charts' },
]

export function DesignStudioKit() {
  const { showDesignKit, setShowDesignKit, theme, updateTheme, resetTheme, saveChanges, discardChanges, isSaving, hasChanges, deployLog } = useMaintenanceMode()
  const [tab, setTab] = useState<KitTab>('theme')
  const [cssCode, setCssCode] = useState('')
  const [appliedComponents, setAppliedComponents] = useState<string[]>([])
  const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null)

  const applyPreset = useCallback((preset: typeof PRESET_THEMES[0]) => {
    Object.entries(preset.theme).forEach(([key, value]) => {
      updateTheme(key as any, value)
    })
  }, [updateTheme])

  const applyCustomCss = useCallback(() => {
    try {
      const styleEl = document.getElementById('b44-custom-css') || document.createElement('style')
      styleEl.id = 'b44-custom-css'
      styleEl.textContent = cssCode
      document.head.appendChild(styleEl)
    } catch {}
  }, [cssCode])

  if (!showDesignKit) return null

  const TABS: { key: KitTab; label: string; icon: string }[] = [
    { key: 'theme', label: 'Theme', icon: '🎨' },
    { key: 'typography', label: 'Typography', icon: '📝' },
    { key: 'layout', label: 'Layout', icon: '📐' },
    { key: 'components', label: 'Components', icon: '🧩' },
    { key: 'templates', label: 'Templates', icon: '📋' },
    { key: 'ai', label: 'AI Ideas', icon: '✨' },
    { key: 'code', label: 'CSS', icon: '💻' },
    { key: 'deploy', label: 'Deploy', icon: '🚀' },
  ]

  return (
    <motion.div drag dragMomentum={false}
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      className="fixed top-16 right-4 z-[100] w-80 bg-[#241c80] border border-indigo-500/20 rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
      style={{ maxHeight: 'calc(100vh - 5rem)' }}>

      {/* Header */}
      <div className="shrink-0 px-4 py-3 bg-gradient-to-r from-indigo-600/20 to-violet-600/10 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎨</span>
            <div>
              <p className="text-white font-bold text-sm leading-none">Design Studio Kit</p>
              <p className="text-[9px] text-indigo-300/60 mt-0.5">Britishce44 Platform Editor</p>
            </div>
          </div>
          <button onClick={() => setShowDesignKit(false)}
            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition text-xs">
            ✕
          </button>
        </div>

        {/* Save/Discard */}
        <div className="flex gap-2 mt-3">
          <button onClick={() => saveChanges()}
            disabled={isSaving}
            className="flex-1 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-bold rounded-lg hover:opacity-90 transition disabled:opacity-60 shadow-lg shadow-indigo-500/20">
            {isSaving ? '⚙ Deploying…' : '💾 Save & Deploy'}
          </button>
          <button onClick={discardChanges}
            className="flex-1 py-1.5 bg-white/5 text-gray-400 text-[10px] font-medium rounded-lg hover:bg-red-500/10 hover:text-red-400 transition border border-white/10">
            ↺ Discard All
          </button>
        </div>
        {hasChanges && !isSaving && (
          <p className="text-[9px] text-amber-400/70 text-center mt-1.5">● Unsaved changes</p>
        )}
      </div>

      {/* Tab navigation */}
      <div className="shrink-0 flex overflow-x-auto border-b border-white/5 bg-black/20">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 transition shrink-0 text-[8px] font-bold
              ${tab === t.key
                ? 'text-white border-b-2 border-indigo-400 bg-indigo-500/10'
                : 'text-gray-500 hover:text-gray-300'}`}>
            <span className="text-base">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-3">

        {/* ── THEME ── */}
        {tab === 'theme' && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-white">Color Variables</span>
              <button onClick={resetTheme} className="text-[9px] text-gray-500 hover:text-red-400 transition">Reset defaults</button>
            </div>
            <div className="space-y-2">
              {COLOR_VARS.map(v => (
                <div key={v.key} className="flex items-center gap-2.5 bg-white/3 rounded-lg px-2.5 py-2 hover:bg-white/5 transition">
                  <label className="relative cursor-pointer">
                    <input type="color"
                      value={(theme as any)[v.key] || '#000000'}
                      onChange={e => updateTheme(v.key as any, e.target.value)}
                      className="w-0 h-0 opacity-0 absolute" />
                    <div className="w-8 h-8 rounded-lg border-2 border-white/10 shadow-inner cursor-pointer hover:scale-105 transition"
                      style={{ backgroundColor: (theme as any)[v.key] }}
                      onClick={e => (e.currentTarget.previousElementSibling as HTMLInputElement)?.click()} />
                  </label>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-white leading-none">{v.label}</p>
                    <p className="text-[8px] text-gray-500 mt-0.5">{v.desc}</p>
                  </div>
                  <span className="text-[9px] font-mono text-gray-500">{(theme as any)[v.key]}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[10px] font-bold text-white mb-2">Preset Themes</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_THEMES.map(p => (
                  <button key={p.name} onClick={() => applyPreset(p)}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2.5 text-left transition group">
                    <span className="text-xl">{p.icon}</span>
                    <div>
                      <p className="text-[10px] font-bold text-white group-hover:text-indigo-300 transition">{p.name}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {Object.values(p.theme).slice(0, 3).map((c, i) => (
                          <div key={i} className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── TYPOGRAPHY ── */}
        {tab === 'typography' && (
          <>
            <p className="text-[10px] font-bold text-white">Font Family</p>
            <div className="space-y-1.5">
              {FONT_OPTIONS.map(font => (
                <button key={font} onClick={() => updateTheme('--app-font-sans', font)}
                  style={{ fontFamily: font }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition
                    ${theme['--app-font-sans'] === font
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-white/10 bg-white/3 text-gray-400 hover:border-white/20'}`}>
                  <span className="text-xs font-medium">{font.split(',')[0]}</span>
                  <span className="text-[9px] text-gray-500">Aa Bb Cc</span>
                </button>
              ))}
            </div>

            <p className="text-[10px] font-bold text-white mt-2">Border Radius</p>
            <div className="flex gap-1.5 flex-wrap">
              {RADIUS_OPTIONS.map(r => (
                <button key={r.value} onClick={() => updateTheme('--radius', r.value)}
                  className={`flex-1 py-2 text-[9px] font-bold rounded-lg border transition min-w-[3.5rem]
                    ${theme['--radius'] === r.value
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-white/10 bg-white/3 text-gray-500 hover:border-white/20'}`}>
                  {r.label}
                </button>
              ))}
            </div>

            <div className="bg-white/3 rounded-xl p-3 mt-2">
              <p className="text-[9px] font-bold text-indigo-400 mb-2">Preview</p>
              <p className="text-white font-bold text-base" style={{ fontFamily: theme['--app-font-sans'] }}>Britishce44 Platform</p>
              <p className="text-gray-400 text-xs" style={{ fontFamily: theme['--app-font-sans'] }}>The First British Center — Taiz, Yemen</p>
              <p className="text-gray-600 text-[9px] mt-1" style={{ fontFamily: theme['--app-font-sans'] }}>
                Advanced educational platform for modern learning.
              </p>
            </div>
          </>
        )}

        {/* ── LAYOUT ── */}
        {tab === 'layout' && (
          <>
            <p className="text-[10px] font-bold text-white">Spacing Scale</p>
            <div className="space-y-2">
              {[
                { label: 'Compact', desc: 'Dense UI, more content visible', val: '0.875rem' },
                { label: 'Default', desc: 'Balanced layout', val: '1rem' },
                { label: 'Comfortable', desc: 'More breathing room', val: '1.125rem' },
                { label: 'Spacious', desc: 'Airy luxury feel', val: '1.25rem' },
              ].map(s => (
                <button key={s.label}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/3 border border-white/10 hover:border-white/20 hover:bg-white/5 transition text-left">
                  <div>
                    <p className="text-[10px] font-semibold text-white">{s.label}</p>
                    <p className="text-[8px] text-gray-500">{s.desc}</p>
                  </div>
                  <span className="text-[9px] font-mono text-gray-500">{s.val}</span>
                </button>
              ))}
            </div>

            <p className="text-[10px] font-bold text-white mt-2">Sidebar Style</p>
            <div className="grid grid-cols-2 gap-1.5">
              {['Dark Glass', 'Navy Solid', 'White Clean', 'Gradient'].map(s => (
                <button key={s}
                  className="py-2.5 px-3 rounded-lg bg-white/3 border border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/5 text-[10px] text-gray-400 hover:text-white transition">
                  {s}
                </button>
              ))}
            </div>

            <p className="text-[10px] font-bold text-white mt-2">Card Elevation</p>
            <div className="flex gap-2">
              {['Flat', 'Subtle', 'Raised', 'Floating'].map(e => (
                <button key={e}
                  className="flex-1 py-2 rounded-lg bg-white/3 border border-white/10 hover:border-indigo-500/40 text-[9px] text-gray-500 hover:text-white transition">
                  {e}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── COMPONENTS ── */}
        {tab === 'components' && (
          <>
            <p className="text-[10px] font-bold text-white">Insert Component</p>
            <p className="text-[9px] text-gray-500">Click to add to the active page section</p>
            <div className="grid grid-cols-2 gap-1.5">
              {COMPONENT_TEMPLATES.map(c => (
                <button key={c.name}
                  onClick={() => setAppliedComponents(prev => [...prev, c.name])}
                  className={`flex flex-col items-start gap-1 p-2.5 rounded-xl border transition text-left
                    ${appliedComponents.includes(c.name)
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-white/10 bg-white/3 hover:border-indigo-500/40 hover:bg-indigo-500/5'}`}>
                  <span className="text-lg">{c.icon}</span>
                  <div>
                    <p className="text-[9px] font-bold text-white">{c.name}</p>
                    <p className="text-[7px] text-gray-500 leading-tight mt-0.5">{c.desc}</p>
                  </div>
                  {appliedComponents.includes(c.name) && (
                    <span className="text-[7px] text-emerald-400 font-bold">✓ Added</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── TEMPLATES ── */}
        {tab === 'templates' && (
          <>
            <p className="text-[10px] font-bold text-white">Full Page Templates</p>
            <div className="space-y-2">
              {PAGE_TEMPLATES.map(t => (
                <button key={t.name}
                  onClick={() => setAppliedTemplate(t.name)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left
                    ${appliedTemplate === t.name
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : 'border-white/10 bg-white/3 hover:border-indigo-500/40 hover:bg-indigo-500/5'}`}>
                  <span className="text-2xl">{t.icon}</span>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-white">{t.name}</p>
                    <p className="text-[8px] text-gray-500 mt-0.5">{t.desc}</p>
                  </div>
                  {appliedTemplate === t.name
                    ? <span className="text-[8px] text-amber-400 font-bold">Active</span>
                    : <span className="text-[8px] text-indigo-400">Apply →</span>}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── AI IDEAS ── */}
        {tab === 'ai' && (
          <>
            <div className="bg-gradient-to-r from-indigo-600/20 to-violet-600/10 border border-indigo-500/20 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🧠</span>
                <p className="text-xs font-bold text-indigo-300">AI Design Assistant</p>
              </div>
              <p className="text-[9px] text-gray-400">
                AI-powered suggestions tailored to Britishce44's educational platform. Click any suggestion to apply it.
              </p>
            </div>
            <div className="space-y-2">
              {AI_SUGGESTIONS.map(s => (
                <div key={s.title}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-white/3 border border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/5 cursor-pointer transition group">
                  <span className="text-xl shrink-0">{s.icon}</span>
                  <div>
                    <p className="text-[10px] font-bold text-white group-hover:text-indigo-300 transition">{s.title}</p>
                    <p className="text-[8px] text-gray-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── CSS EDITOR ── */}
        {tab === 'code' && (
          <>
            <p className="text-[10px] font-bold text-white">Custom CSS Editor</p>
            <p className="text-[9px] text-gray-500">Write CSS that applies across the entire platform.</p>
            <textarea
              value={cssCode}
              onChange={e => setCssCode(e.target.value)}
              placeholder={`/* Custom platform CSS */\n.glass-panel {\n  backdrop-filter: blur(20px);\n}\n\n.classroom-door:hover {\n  border-color: var(--gold);\n}`}
              className="w-full h-48 bg-black/40 text-emerald-400 font-mono text-[9px] border border-white/10 rounded-xl p-3 outline-none focus:border-indigo-500/50 resize-none placeholder-gray-700 leading-relaxed"
            />
            <div className="flex gap-2">
              <button onClick={applyCustomCss}
                className="flex-1 py-2 bg-emerald-600/80 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition">
                ▶ Apply CSS
              </button>
              <button onClick={() => setCssCode('')}
                className="py-2 px-3 bg-white/5 text-gray-400 text-[10px] rounded-lg hover:bg-red-500/10 hover:text-red-400 transition border border-white/10">
                Clear
              </button>
            </div>
            <div className="bg-black/30 rounded-xl p-3 border border-white/5">
              <p className="text-[9px] font-bold text-indigo-400 mb-2">CSS Variables Reference</p>
              <div className="space-y-0.5 font-mono">
                {['--navy', '--gold', '--royal-blue', '--accent-indigo', '--accent-violet', '--accent-emerald', '--radius'].map(v => (
                  <p key={v} className="text-[8px] text-gray-500">var({v})</p>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── DEPLOY ── */}
        {tab === 'deploy' && (
          <>
            <div className="bg-gradient-to-br from-indigo-600/20 to-violet-600/10 border border-indigo-500/20 rounded-xl p-4">
              <p className="text-sm font-bold text-white mb-1">🚀 Deploy Changes</p>
              <p className="text-[9px] text-gray-400">
                Saves all design changes and publishes them across the entire platform — all classrooms, dashboards, and user portals update simultaneously.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { icon: '🎨', label: 'Theme variables', detail: hasChanges ? '● Modified' : '✓ Unchanged', color: hasChanges ? 'text-amber-400' : 'text-emerald-400' },
                { icon: '🧩', label: 'Components added', detail: `${appliedComponents.length} component(s)`, color: 'text-indigo-400' },
                { icon: '📋', label: 'Active template', detail: appliedTemplate || 'None', color: 'text-gray-400' },
                { icon: '💻', label: 'Custom CSS', detail: cssCode.length > 0 ? `${cssCode.split('\n').length} lines` : 'None', color: 'text-gray-400' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between px-3 py-2 bg-white/3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-[10px] text-gray-400">{item.label}</span>
                  </div>
                  <span className={`text-[9px] font-medium ${item.color}`}>{item.detail}</span>
                </div>
              ))}
            </div>

            <button onClick={() => saveChanges()}
              disabled={isSaving}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm rounded-xl hover:opacity-90 transition disabled:opacity-60 shadow-xl shadow-indigo-500/20">
              {isSaving ? '⚙ Deploying...' : '🚀 Save & Deploy Platform'}
            </button>

            {deployLog.length > 0 && (
              <div className="bg-black/50 rounded-xl border border-white/5 p-3">
                <p className="text-[9px] font-bold text-indigo-400 mb-2">Deploy Log</p>
                <div className="space-y-0.5 max-h-40 overflow-y-auto">
                  {deployLog.map((line, i) => (
                    <motion.p key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="text-[9px] font-mono text-emerald-400">{line}</motion.p>
                  ))}
                  {isSaving && (
                    <p className="text-[9px] font-mono text-indigo-400 animate-pulse">◦◦◦ Processing...</p>
                  )}
                </div>
              </div>
            )}

            <button onClick={discardChanges}
              className="w-full py-2 bg-transparent text-red-400/60 text-[10px] font-medium rounded-xl hover:text-red-400 hover:bg-red-400/5 transition border border-red-400/10">
              ↺ Discard All Changes — Restore Defaults
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}
