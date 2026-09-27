import path from "path"
import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from "vite-plugin-pwa"

function devServiceWorkerUnregisterPlugin(): Plugin {
  return {
    name: "dev-sw-unregister",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        console.log(`[REQ] ${req.method} ${req.url}`)
        const url = req.url?.split("?")[0]
        if (url === "/sw.js") {
          res.setHeader("Content-Type", "application/javascript")
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate")
          res.end(`
            self.addEventListener('install', () => { self.skipWaiting(); });
            self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });
            self.addEventListener('push', (event) => {
              if (!event.data) return;
              let payload = {
                title: 'Gaslighting',
                body: 'Notifikasi baru',
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                url: '/bills',
              };
              try {
                payload = { ...payload, ...event.data.json() };
              } catch {
                payload.body = event.data.text();
              }
              event.waitUntil(
                self.registration.showNotification(payload.title || 'Gaslighting', {
                  body: payload.body,
                  icon: payload.icon || '/pwa-192x192.png',
                  badge: payload.badge || '/pwa-192x192.png',
                  data: { url: payload.url || '/bills' },
                })
              );
            });
            self.addEventListener('notificationclick', (event) => {
              event.notification.close();
              const targetUrl = event.notification.data?.url || '/bills';
              event.waitUntil(
                self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
                  for (const client of clients) {
                    if ('focus' in client && client.url.includes(targetUrl)) {
                      return client.focus();
                    }
                  }
                  if (self.clients.openWindow) {
                    return self.clients.openWindow(targetUrl);
                  }
                })
              );
            });
            self.addEventListener('fetch', (event) => {
              const url = new URL(event.request.url);
              if (url.pathname === '/share-target' && event.request.method === 'POST') {
                event.respondWith(
                  (async () => {
                    try {
                      const formData = await event.request.formData();
                      const file = formData.get('receipt');
                      if (file && file instanceof File) {
                        const cache = await caches.open('shared-receipts');
                        const response = new Response(file, {
                          headers: {
                            'Content-Type': file.type || 'image/jpeg',
                            'X-Shared-Name': encodeURIComponent(file.name || 'receipt.jpg'),
                          },
                        });
                        await cache.put('/shared-receipt-latest', response);
                        return Response.redirect('/transactions/new?shared_receipt=1', 303);
                      }
                    } catch (err) {
                      console.error('Failed to handle shared receipt in dev SW:', err);
                    }
                    return Response.redirect('/transactions/new', 303);
                  })()
                );
              }
            });
          `)
          return
        }
        if (url === "/registerSW.js") {
          res.setHeader("Content-Type", "application/javascript")
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate")
          res.end(`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js', { scope: '/' });
              });
            }
          `)
          return
        }
        if (url?.startsWith("/assets/index-") && url?.endsWith(".js")) {
          res.setHeader("Content-Type", "application/javascript")
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate")
          res.end(`
            if (typeof window !== 'undefined') {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((regs) => {
                  Promise.all(regs.map((r) => r.unregister())).then(() => {
                    if ('caches' in window) {
                      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => {
                        window.location.reload();
                      });
                    } else {
                      window.location.reload();
                    }
                  });
                });
              } else {
                window.location.reload();
              }
            }
          `)
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [
    devServiceWorkerUnregisterPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Gaslighting - Manajemen Keuangan",
        short_name: "Gaslighting",
        description: "Aplikasi manajemen keuangan untuk pasangan",
        theme_color: "#9AB17A",
        background_color: "#FBE8CE",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512x512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          {
            name: "Catat Pengeluaran",
            short_name: "Pengeluaran",
            description: "Catat transaksi pengeluaran baru",
            url: "/transactions/new?type=expense",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "Catat Pemasukan",
            short_name: "Pemasukan",
            description: "Catat transaksi pemasukan baru",
            url: "/transactions/new?type=income",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "Scan Struk Belanja",
            short_name: "Scan Struk",
            description: "Pindai struk belanja dengan kamera atau OCR",
            url: "/transactions/new?scan=true",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192", type: "image/png" }],
          },
        ],
        share_target: {
          action: "/share-target",
          method: "POST",
          enctype: "multipart/form-data",
          params: {
            title: "title",
            text: "text",
            url: "url",
            files: [
              {
                name: "receipt",
                accept: ["image/*"],
              },
            ],
          },
        },
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    host: "127.0.0.1",
    allowedHosts: ["it-50.tail4bf5a0.ts.net", ".ts.net"],
    hmr: {
      clientPort: 443,
    },
  },
  preview: {
    host: true,
    port: 5173,
    allowedHosts: ["it-50.tail4bf5a0.ts.net", ".ts.net"],
  },
})
