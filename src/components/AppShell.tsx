import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Header } from './Header'
import { MobileNav, Nav } from './Nav'
import { InsightPanel } from './InsightPanel'
import { AIDrawer } from './AIDrawer'
import { useDemo } from '../store/useDemo'

export function AppShell() {
  const [aiOpen, setAiOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const { pathname, search } = useLocation()

  return (
    <div className="h-[100dvh] overflow-hidden">
      <Header onAskAi={() => setAiOpen(true)} onOpenNav={() => setNavOpen(true)} />
      {/* RTL: the first grid column lands on the right, so navigation is first
          in the DOM and the insight panel is last. Below md the sidebar column
          collapses and the same tree moves into MobileNav. */}
      <div className="grid h-[calc(100dvh-4rem)] grid-cols-1 md:grid-cols-[248px_1fr] xl:grid-cols-[248px_1fr_320px]">
        <Nav />
        <main key={pathname + search} className="page-enter overflow-y-auto px-4 py-5 md:px-6">
          <Outlet />
        </main>
        <InsightPanel />
      </div>
      <MobileNav open={navOpen} onClose={() => setNavOpen(false)} />
      <AIDrawer open={aiOpen} onClose={() => setAiOpen(false)} />
      <Toast />
    </div>
  )
}

function Toast() {
  const { toast, setToast } = useDemo()
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3600)
    return () => clearTimeout(t)
  }, [toast, setToast])

  if (!toast) return null
  return (
    <div
      role="status"
      className="fixed bottom-6 start-6 z-20 rounded-[12px] border border-line bg-surface px-4 py-3 text-sm shadow-lg"
    >
      {toast}
    </div>
  )
}
