import { useEffect, useState } from 'react'

/* This page is shown when a student clicks the download button in Users management.
   It generates a unique install link with the student's token embedded. */

export function AppDownloadPage() {
  const [installUrl, setInstallUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [pwaInstalled, setPwaInstalled] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const name = params.get('name') || 'Student'
    const token = params.get('token') || ''
    const baseUrl = window.location.origin
    setInstallUrl(`${baseUrl}/app?name=${encodeURIComponent(name)}&token=${encodeURIComponent(token)}`)

    /* Listen for PWA install */
    const handler = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as any
      promptEvent.prompt()
      promptEvent.userChoice.then((result: { outcome: string }) => {
        if (result.outcome === 'accepted') setPwaInstalled(true)
      })
    }
    window.addEventListener('beforeinstallprompt', handler as any)
    return () => window.removeEventListener('beforeinstallprompt', handler as any)
  }, [])

  const copyLink = () => {
    navigator.clipboard.writeText(installUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareViaWhatsApp = () => {
    const text = `📱 Britishce44 Student App — Install and login with your account.\n\nTap the link below to open the app:\n${installUrl}\n\nAfter opening, install the app on your device for alarms & notifications.`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(160deg, #0a1628, #1a1a4e)' }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: 'rgba(20,30,80,0.90)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,160,23,0.25)', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>
        <div className="h-1 golden-gradient" />
        <div className="p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4A017] to-[#F5C518] flex items-center justify-center mx-auto mb-5 shadow-xl shadow-golden/20">
            <span className="text-3xl font-black text-[#17125c]">B44</span>
          </div>
          <h2 className="text-xl font-black text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
            Student Mobile App
          </h2>
          <p className="text-sm text-gray-300 mb-6 font-medium">
            Install the Britishce44 app on your phone for real-time classes, alarms, messages, and collaboration.
          </p>

          {pwaInstalled ? (
            <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.20)' }}>
              <p className="text-emerald-400 font-bold text-sm">✅ App installed successfully!</p>
              <p className="text-xs text-gray-400 mt-1">Open the app from your home screen.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <button onClick={shareViaWhatsApp}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition shadow-lg"
                style={{ background: 'linear-gradient(135deg,#25D366,#1DA851)', boxShadow: '0 4px 16px rgba(37,211,102,0.30)' }}>
                📱 Send Install Link via WhatsApp
              </button>
              <button onClick={copyLink}
                className="w-full py-3 rounded-xl text-sm font-bold transition"
                style={{ background: copied ? 'rgba(52,211,153,0.10)' : 'rgba(37,99,235,0.10)', color: copied ? '#34d399' : '#60a5fa', border: `1px solid ${copied ? 'rgba(52,211,153,0.20)' : 'rgba(37,99,235,0.20)'}` }}>
                {copied ? '✅ Link Copied!' : '📋 Copy Install Link'}
              </button>
            </div>
          )}

          {/* How to install */}
          <div className="mt-6 rounded-2xl p-4 text-left" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-bold text-white mb-3">📖 How to Install</p>
            <ol className="space-y-2 text-[10px] text-gray-400 list-decimal list-inside">
              <li>Open the link on your phone (Chrome or Safari)</li>
              <li>Your credentials will be pre-filled — tap <strong className="text-white">Sign In</strong></li>
              <li>Tap the browser menu ⋮ and select <strong className="text-white">"Add to Home Screen"</strong></li>
              <li>The app will appear on your phone like a native app</li>
              <li>Enable notifications when prompted for class alarms</li>
              <li>The app auto-updates when settings change in the management room</li>
            </ol>
          </div>

          <p className="text-[10px] text-gray-600 mt-4">
            The app works best on Android or iOS with Chrome/Safari.
            Class alarms ring 5 minutes before each class even when the app is closed.
          </p>
        </div>
      </div>
    </div>
  )
}
