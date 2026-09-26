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
        if (req.url === "/sw.js" || req.url === "/registerSW.js") {
          res.setHeader("Content-Type", "application/javascript")
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate")
          res.end(`
            self.addEventListener('install', () => { self.skipWaiting(); });
            self.addEventListener('activate', (event) => {
              event.waitUntil(
                caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
                  .then(() => self.registration.unregister())
                  .then(() => self.clients.matchAll({ type: 'window' }))
                  .then((clients) => {
                    for (const client of clients) client.navigate(client.url);
                  })
              );
            });
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
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "127.0.0.1",
    allowedHosts: ["it-50.tail4bf5a0.ts.net", ".ts.net"],
  },
  preview: {
    host: true,
    port: 5173,
    allowedHosts: ["it-50.tail4bf5a0.ts.net", ".ts.net"],
  },
})
