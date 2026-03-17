import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, LayoutGrid, TrendingUp, ShieldCheck, ListFilter,
  Brain, Menu, X, ChevronRight, ExternalLink
} from 'lucide-react'
import { useCourtyardData } from '@/hooks/use-courtyard-data'
import { PACKS, type PackData } from '@/data/packs'
import PackTable from '@/components/PackTable'
import LiveTicker from '@/components/LiveTicker'
import StatsBar from '@/components/StatsBar'
import AIAssistant from '@/components/AIAssistant'

/* ── Nav items ── */
const NAV = [
  { icon: LayoutGrid,  label: 'EV Terminal',     active: true  },
  { icon: TrendingUp,  label: 'Analytics',        active: false },
  { icon: ShieldCheck, label: 'Buyback Scanner',  active: false },
  { icon: ListFilter,  label: 'Alpha Signals',    active: false },
]

/* ── Category filters ── */
const CATS = ['All', 'Basketball', 'Pokémon', 'Football', 'Baseball', 'Sports']

/* ── Sidebar ── */
function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Overlay (mobile) */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar body */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 lg:z-auto
        w-64 h-full flex flex-col
        glass border-r border-border/60
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-border/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary fill-primary" />
            </div>
            <span className="font-black text-lg tracking-tight italic text-gradient">PulseAI</span>
          </div>
          <button onClick={onClose} className="lg:hidden w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted/50 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground px-3 pb-2 pt-1">Workspace</p>
          {NAV.map((item) => (
            <button key={item.label}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all group ${
                item.active
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
              {item.active && <ChevronRight className="w-3 h-3 opacity-60" />}
            </button>
          ))}

          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground px-3 pb-2 pt-5">Markets</p>
          {CATS.filter(c => c !== 'All').map(cat => {
            const EMOJI: Record<string, string> = { Basketball: '🏀', Pokémon: '⚡', Football: '🏈', Baseball: '⚾', Sports: '🏆' }
            const count = PACKS.filter(p => p.category === cat).length
            return (
              <button key={cat}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all font-medium"
              >
                <div className="flex items-center gap-2.5">
                  <span>{EMOJI[cat]}</span>
                  <span>{cat}</span>
                </div>
                <span className="text-[10px] font-mono bg-muted/60 px-1.5 py-0.5 rounded">{count}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/60 flex-shrink-0">
          <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-black text-primary">EV</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">Alpha Collector</p>
              <p className="text-[10px] text-muted-foreground font-mono">Pro Member</p>
            </div>
          </div>
          <a href="https://courtyard.io" target="_blank" rel="noreferrer"
            className="mt-2 w-full flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
            <ExternalLink className="w-3 h-3" /> Open Courtyard.io
          </a>
        </div>
      </aside>
    </>
  )
}

/* ── Main App ── */
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { packs: rawPacks, livePulls } = useCourtyardData()
  // Cast to PackData[] — both types share the same shape
  const packs = rawPacks as unknown as PackData[]

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(222,47%,3%)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top header */}
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-border/60 bg-card/30 backdrop-blur-xl flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Menu className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-tight uppercase italic hidden lg:block">EV Terminal</span>
              <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
                <span className="live-dot" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Live</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono text-muted-foreground">
              <span><span className="text-primary font-black">{packs.filter(p => p.evRatio >= 1).length}</span> +EV packs</span>
              <span><span className="text-foreground font-bold">{packs.reduce((s, p) => s + p.totalPulls, 0).toLocaleString()}</span> pulls</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
          </div>
        </header>

        {/* Live ticker */}
        <LiveTicker />

        {/* Scrollable main content */}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">

              {/* Page heading */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-black tracking-tight italic text-gradient leading-none">
                    Alpha Terminal
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">
                    Real-time Expected Value tracking for <span className="text-foreground font-bold">Courtyard.io</span> mystery packs
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="glass rounded-lg px-3 py-2 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">Market Avg EV</p>
                    <p className="font-black text-base font-mono text-primary leading-tight">
                      {(packs.reduce((s, p) => s + p.evRatio, 0) / packs.length).toFixed(3)}x
                    </p>
                  </div>
                  <div className="glass rounded-lg px-3 py-2 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">Total Tracked</p>
                    <p className="font-black text-base font-mono leading-tight">
                      {packs.reduce((s, p) => s + p.totalPulls, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats bar */}
              <StatsBar />

              {/* Main EV table */}
              <div className="glass overflow-hidden">
                <div className="px-4 py-3 border-b border-border/50 bg-card/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    <span className="font-black text-sm tracking-tight uppercase italic">Pack Scanner</span>
                    <span className="text-[10px] font-mono text-muted-foreground ml-2 hidden sm:block">
                      {packs.length} packs · auto-refreshes every 8s
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="live-dot" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Live Data</span>
                  </div>
                </div>
                <PackTable packs={packs} />
              </div>

            </div>
          </main>

          {/* AI Sidebar (desktop only) */}
          <aside className="hidden xl:flex flex-col w-[320px] border-l border-border/60 flex-shrink-0">
            <AIAssistant packs={packs} />
          </aside>
        </div>
      </div>
    </div>
  )
}
