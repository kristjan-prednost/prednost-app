const CACHE_NAME = 'prednost-v1'
const urlsToCache = [
  '/',
  '/index.html',
]

self.addEventListener('install', event => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    )
  )
})

self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request))
})