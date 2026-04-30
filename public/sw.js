self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    )
  )
})

self.addEventListener('fetch', event => {
  if (event.request.url.includes('supabase.co')) return
  event.respondWith(fetch(event.request))
})