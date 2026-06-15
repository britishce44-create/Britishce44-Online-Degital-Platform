import { useState } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'

const PLATFORMS = [
  { os: 'Windows', icon: '🪟', size: '64 MB', ver: '2.1.0', color: '#2563eb', note: 'Windows 10/11 · 64-bit' },
  { os: 'macOS', icon: '🍎', size: '72 MB', ver: '2.1.0', color: '#00ae74', note: 'Apple Silicon & Intel' },
  { os: 'Android', icon: '🤖', size: '38 MB', ver: '2.1.0', color: '#34d399', note: 'Android 8.0+ · APK / Play' },
  { os: 'iOS', icon: '📱', size: '41 MB', ver: '2.1.0', color: '#67e8f9', note: 'iOS 15+ · App Store' },
  { os: 'Linux', icon: '🐧', size: '58 MB', ver: '2.1.0', color: '#7dd3fc', note: 'AppImage / .deb' },
]

const PWA_BENEFITS = [
  { icon: '⚡', text: 'Installs in seconds — no app store needed' },
  { icon: '📶', text: 'Works offline for lessons & homework' },
  { icon: '🔔', text: 'Native push notifications' },
  { icon: '🔄', text: 'Always up to date automatically' },
]

export function DownloadCenterPage() {
  const { t } = useI18n()
  const [installed, setInstalled] = useState(false)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-gradient-aurora">⬇️ {t('nav.downloadcenter')}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Get Britishce44 on every device — or install it instantly as an app</p>
      </div>

      {/* PWA install hero */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(120deg,rgba(27,62,166,0.4),rgba(26, 19, 92,0.7))', border: '1px solid rgba(37,99,235,0.3)' }}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-20" style={{ background: 'radial-gradient(circle,#00ae74,transparent 70%)' }} />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30">📲</div>
            <div>
              <p className="text-base font-black text-white">Install the Web App (PWA)</p>
              <p className="text-xs text-gray-400 mt-0.5">Fastest way to get started — installs straight from your browser</p>
            </div>
          </div>
          <button onClick={() => setInstalled(true)}
            className="px-5 py-3 rounded-xl font-bold text-sm text-white transition-all"
            style={{ background: installed ? 'rgba(52,211,153,0.2)' : 'linear-gradient(90deg,#00ae74,#009e69)', border: installed ? '1px solid rgba(52,211,153,0.4)' : 'none' }}>
            {installed ? '✓ App Installed' : '⬇️ Install Now'}
          </button>
        </div>
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          {PWA_BENEFITS.map(b => (
            <div key={b.text} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span className="text-sm">{b.icon}</span>
              <span className="text-[10px] text-gray-300">{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Native downloads */}
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Native apps</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PLATFORMS.map((p, i) => (
            <motion.div key={p.os} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-4 relative overflow-hidden" style={{ background: 'rgba(26, 19, 92,0.7)', border: `1px solid ${p.color}22` }}>
              <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg,transparent,${p.color},transparent)` }} />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: `${p.color}1a`, border: `1px solid ${p.color}33` }}>{p.icon}</div>
                <div>
                  <p className="text-sm font-bold text-white">{p.os}</p>
                  <p className="text-[9px] text-gray-500">{p.note}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[9px] text-gray-500 mb-3">
                <span>v{p.ver}</span><span>{p.size}</span>
              </div>
              <button className="w-full py-2.5 rounded-xl text-[11px] font-bold text-white transition-all"
                style={{ background: `${p.color}22`, border: `1px solid ${p.color}40` }}>
                Download for {p.os}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <p className="text-center text-[10px] text-gray-600">All apps are signed & verified · SHA-256 checksums available · © Britishce44 Online Digital School</p>
    </div>
  )
}
