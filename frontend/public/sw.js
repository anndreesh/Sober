const CACHE_NAME = 'sober-free-web-v4'
const APP_SHELL = ['/', '/index.html', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const request = event.request
  event.respondWith(
    (async () => {
      const isAppShell = request.mode === 'navigate' || new URL(request.url).pathname === '/index.html'
      const cached = await caches.match(request)

      if (isAppShell) {
        try {
          const response = await fetch(request)
          if (response?.ok) {
            const cache = await caches.open(CACHE_NAME)
            await cache.put(request, response.clone())
          }
          return response
        } catch {
          return cached ?? Response.error()
        }
      }

      if (cached) return cached
      const response = await fetch(request)
      if (!response || response.status !== 200 || response.type !== 'basic') return response

      const cache = await caches.open(CACHE_NAME)
      await cache.put(request, response.clone())
      return response
    })(),
  )
})
