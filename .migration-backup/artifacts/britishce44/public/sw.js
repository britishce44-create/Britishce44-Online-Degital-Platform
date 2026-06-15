const CACHE_NAME = 'britishce44-v1'
const ASSETS = [
  '/',
  '/classrooms',
  '/dashboard',
  '/login',
  '/manifest.json',
]

const OFFLINE_URLS = [
  '/api/classrooms',
  '/api/recordings',
  '/api/materials',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS)
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  if (OFFLINE_URLS.some((u) => url.pathname.startsWith(u))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') {
    self.skipWaiting()
  }
})
