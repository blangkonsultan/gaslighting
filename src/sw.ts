/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching"
import { registerRoute } from "workbox-routing"
import { NetworkFirst } from "workbox-strategies"
import { CacheableResponsePlugin } from "workbox-cacheable-response"
import { ExpirationPlugin } from "workbox-expiration"

declare const self: ServiceWorkerGlobalScope

// Clean up outdated workbox caches
cleanupOutdatedCaches()

// Precache static assets injected by VitePWA
precacheAndRoute(self.__WB_MANIFEST)

// Supabase API runtime caching (NetworkFirst)
registerRoute(
  /^https:\/\/.*\.supabase\.co\/.*/i,
  new NetworkFirst({
    cacheName: "supabase-api",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 300,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
)

// Immediately activate and claim clients on install and activate
self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

// Listen for Web Push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return

  interface PushPayload {
    title?: string
    body?: string
    icon?: string
    badge?: string
    url?: string
  }

  let payload: PushPayload = {
    title: "Gaslighting",
    body: "Notifikasi baru",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    url: "/bills",
  }

  try {
    const data = event.data.json() as PushPayload
    payload = { ...payload, ...data }
  } catch {
    payload.body = event.data.text()
  }

  const notificationOptions: NotificationOptions = {
    body: payload.body,
    icon: payload.icon || "/pwa-192x192.png",
    badge: payload.badge || "/pwa-192x192.png",
    data: {
      url: payload.url || "/transactions",
    },
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Gaslighting", notificationOptions)
  )
})

// Handle notification click: focus open window or open new window
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data as { url?: string } | undefined)?.url || "/transactions"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client && client.url.includes(targetUrl)) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})

// Handle Web Share Target POST requests with shared receipt image
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)
  if (url.pathname === "/share-target" && event.request.method === "POST") {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData()
          const file = formData.get("receipt")
          if (file && file instanceof File) {
            const cache = await caches.open("shared-receipts")
            const response = new Response(file, {
              headers: {
                "Content-Type": file.type || "image/jpeg",
                "X-Shared-Name": encodeURIComponent(file.name || "receipt.jpg"),
              },
            })
            await cache.put("/shared-receipt-latest", response)
            return Response.redirect("/transactions/new?shared_receipt=1", 303)
          }
        } catch (err) {
          console.error("Failed to handle shared receipt in SW:", err)
        }
        return Response.redirect("/transactions/new", 303)
      })()
    )
  }
})
