// KS Facture — Service Worker
// Strategy: Network-first for API calls, cache-first for static assets.
// This gives offline shell support without breaking Supabase live data.

const CACHE_NAME = 'ks-facture-v1'

// App shell files to cache on install
const SHELL = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

// ── Install: cache the app shell ─────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  )
  self.skipWaiting()
})

// ── Activate: clean up old caches ────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch: network-first, fall back to cache ─────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and cross-origin requests (Supabase API, Google Fonts)
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses for static assets
        if (response.ok && !url.pathname.startsWith('/api')) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      })
      .catch(() => {
        // Offline fallback: return cached version or root (app shell)
        return caches.match(request) || caches.match('/')
      })
  )
})
