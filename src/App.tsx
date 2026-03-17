import React, { useState } from 'react'
import { Zap, LayoutGrid, TrendingUp, ShieldCheck, ListFilter, Bell, Menu, X, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import LiveTicker from '@/components/LiveTicker'
import StatsBar from '@/components/StatsBar'
import PackTable from '@/components/PackTable'
import AIAssistant from '@/components/AIAssistant'
import { PACKS, RECENT_PULLS } from '@/data/packs'

type NavPage = 'terminal' | 'analytics' | 'buyback' | 'scanner'

const NAV_ITEMS: { id: NavPage; icon: React.ElementType; label: string; badge?: string }[] = [
  { id: 'terminal', icon: LayoutGrid, label: 'Terminal' },
  { id: 'analytics', icon: TrendingUp, label: 'Analytics', badge: 'NEW' },
  { id: 'buyback', icon: ShieldCheck, label: 'Buyback Pulse' },
  { id: 'scanner', icon: ListFilter, label: 'Alpha Scanner' },
]

function Sidebar({ activePage, setActivePage, collapsed, setCollapsed }: {
  activePage: NavPage
  setActivePage: (p: NavPage) => void
  collapsed: boolean
  setCollapsed: (v: boolean) => void
}) {
  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} h-screen flex flex-col border-r border-border/60 bg-[#030c18]/90 backdrop-blur-xl transition-all duration-300 flex-shrink-0 z-30`}>
      <div className="h-14 flex items-center px-4 border-b border-border/60 justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <span className="font-black text-lg tracking-tight overflow-hidden whitespace-nowrap">
              Pulse<span className="text-primary">AI</span>
            </span>
          )}
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded">
          {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 pb-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Navigation</span>
          </div>
        )}
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setActivePage(item.id)}
            className={`w-full flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-bold transition-all ${
              activePage === item.id
                ? 'bg-primary/15 text-primary border border-primary/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
            {!collapsed && item.badge && (
              <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/20 text-primary">{item.badge}</span>
            )}
          </button>
        ))}

        {!collapsed && (
          <div className="mt-4 mx-1 p-3 rounded-xl border border-primary/20 bg-primary/5">
            <div className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">Best Value Now</div>
            <div className="font-bold text-xs text-foreground leading-tight">{PACKS[0].name}</div>
            <div className="font-mono text-lg font-black text-green-400 mt-0.5">{PACKS[0].evRatio.toFixed(3)}x</div>
            <div className="text-[9px] text-muted-foreground mt-0.5">${PACKS[0].price.toFixed(2)} per pull</div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border/60">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-teal-600/30 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-black text-primary">KA</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold truncate">Alpha Collector</div>
              <div className="text-[9px] text-primary font-medium">Pro Member</div>
            </div>
            <Bell className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer" />
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-teal-600/30 border border-primary/30 flex items-center justify-center">
              <span className="text-[11px] font-black text-primary">KA</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

function RecentPullsGrid() {
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden bg-card/30 backdrop-blur-sm">
      <div className="px-5 py-3.5 border-b border-border/60 bg-[#060f1f]/60 flex items-center justify-between">
        <h2 className="font-black text-sm uppercase tracking-widest">Recent Big Pulls</h2>
        <span className="text-[10px] text-muted-foreground">From active members</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-0">
        {RECENT_PULLS.slice(0, 8).map((pull, i) => (
          <motion.div key={pull.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className="border-r border-b border-border/40 p-4 group hover:bg-primary/5 transition-colors cursor-pointer">
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-secondary/30 mb-3 border border-border/40 group-hover:border-primary/30 transition-colors">
              <img src={pull.imageUrl} alt={pull.cardName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const el = e.target as HTMLImageElement
                  el.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground px-2 text-center">${pull.cardName}</div>`
                }} />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold leading-tight truncate">{pull.cardName}</div>
              <div className="text-green-400 font-mono font-black text-sm">${pull.value.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">from a <span className="text-foreground/60">${pull.packPrice}</span> pack</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-20">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-black">{label}</h2>
        <p className="text-muted-foreground text-sm">Coming soon — building the alpha engine.</p>
      </div>
    </div>
  )
}

export default function App() {
  const [activePage, setActivePage] = useState<NavPage>('terminal')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showAI, setShowAI] = useState(true)

  return (
    <div className="flex h-screen overflow-hidden bg-[#020810] text-foreground">
      <Sidebar activePage={activePage} setActivePage={setActivePage} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-border/60 bg-[#030c18]/80 backdrop-blur-md flex items-center px-5 gap-4 flex-shrink-0">
          <div className="flex-1 flex items-center gap-3">
            <h1 className="font-black text-base uppercase tracking-wide flex items-center gap-2">
              Alpha Terminal
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border text-[9px] font-black uppercase tracking-widest animate-pulse">LIVE</Badge>
            </h1>
            <span className="text-[11px] text-muted-foreground hidden md:block">Real-time EV tracking for Courtyard.io mystery packs</span>
          </div>
          <div className="flex items-center gap-2.5">
            <a href="https://courtyard.io/vending-machine/mystery-pack-machine" target="_blank" rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors">
              Open Courtyard <ExternalLink className="w-3 h-3" />
            </a>
            <Button variant="outline" size="sm"
              className={`h-8 text-[11px] font-black gap-1.5 ${showAI ? 'border-primary/40 text-primary bg-primary/10' : 'border-border/60 text-muted-foreground'}`}
              onClick={() => setShowAI(v => !v)}>
              <Zap className="w-3 h-3" /> AI Strategy
            </Button>
          </div>
        </header>

        <LiveTicker />

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <AnimatePresence mode="wait">
              {activePage === 'terminal' && (
                <motion.div key="terminal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="p-5 space-y-6">
                  <StatsBar />
                  <PackTable packs={PACKS} />
                  <RecentPullsGrid />
                </motion.div>
              )}
              {activePage !== 'terminal' && (
                <motion.div key={activePage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex">
                  <ComingSoon label={activePage === 'analytics' ? 'Analytics Dashboard' : activePage === 'buyback' ? 'Buyback Pulse' : 'Alpha Scanner'} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <AnimatePresence>
            {showAI && (
              <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                className="border-l border-border/60 flex-shrink-0 overflow-hidden">
                <div className="w-80 h-full p-3">
                  <AIAssistant />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
