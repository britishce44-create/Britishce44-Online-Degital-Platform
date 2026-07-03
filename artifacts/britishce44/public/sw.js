const CACHE_NAME = 'britishce44-v2'
const STATIC_ASSETS = ['/', '/app', '/offline']
const API_CACHE = '/api/v1/'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

/* Network-first for API; cache-fallback for static */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  if (url.pathname.startsWith(API_CACHE)) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone))
          return res
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/app'))
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((c) => c || fetch(event.request))
  )
})

/* ── Push notifications ── */
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data?.json() || {} } catch {}
  const { title = 'Britishce44', body = '', icon = '/favicon.svg', tag = 'b44', data: payload = {} } = data
  const options = { body, icon, tag, data: payload, badge: '/favicon.svg', vibrate: [200, 100, 200] }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/app'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

/* ── Message channel (for alarm scheduling from app) ── */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {}
  if (type === 'schedule-alarm') {
    const { id, time, title, body } = payload || {}
    const now = Date.now()
    const delay = Math.max(0, time - now)
    if (delay > 0) {
      setTimeout(() => {
        self.registration.showNotification(title || 'Class Reminder', {
          body: body || 'Your class is starting soon!',
          icon: '/favicon.svg',
          tag: `alarm-${id}`,
          vibrate: [300, 150, 300, 150, 300],
          requireInteraction: true,
        })
      }, delay)
    }
  }
  if (type === 'skip-waiting') {
    self.skipWaiting()
  }
})

/* ── Periodic background sync (for checking class schedule) ── */
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'class-check') {
    event.waitUntil(checkUpcomingClasses())
  }
})

async function checkUpcomingClasses() {
  try {
    const res = await fetch('/api/v1/classroom-assessment/schedule')
    const data = await res.json()
    const classes = data?.classes || []
    const now = Date.now()
    for (const cls of classes) {
      const classTime = new Date(cls.startTime).getTime()
      const diff = classTime - now
      if (diff > 0 && diff <= 5 * 60 * 1000) {
        self.registration.showNotification('Class Starting Soon!', {
          body: `${cls.name} begins in ${Math.ceil(diff / 60000)} minutes`,
          icon: '/favicon.svg',
          tag: `class-${cls.id}`,
          vibrate: [300, 150, 300],
          requireInteraction: true,
        })
      }
    }
  } catch {}
}
