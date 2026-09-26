import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { AppErrorBoundary } from "@/components/shared/AppErrorBoundary"

if (import.meta.env.DEV && "caches" in window) {
  caches.keys().then((keys) => {
    for (const key of keys) {
      if (key.includes("workbox") || key.includes("supabase")) {
        void caches.delete(key)
      }
    }
  })
}

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
      console.error("SW registration error:", err)
    })
  })
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
