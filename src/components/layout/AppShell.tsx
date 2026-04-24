import { Outlet } from "react-router-dom"
import { MobileBottomNav } from "./MobileBottomNav"
import { DesktopSidebar } from "./DesktopSidebar"
import { Header } from "./Header"

export function AppShell() {
  return (
    <div className="flex min-h-dvh">
      <DesktopSidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="mx-auto max-w-4xl p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
