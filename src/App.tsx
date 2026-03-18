import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  LayoutGrid,
  TrendingUp,
  ShieldCheck,
  ListFilter,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  Bell,
  RefreshCw,
} from 'lucide-react'
import { useCourtyardData } from '@/hooks/use-courtyard-data'
import PackTable from '@/components/PackTable'
import LiveTicker from '@/components/LiveTicker'
import StatsBar from '@/components/StatsBar'

const NAV = [
  { icon: LayoutGrid, label: 'Pack Terminal', active: true },
  { icon: TrendingUp, label: 'Analytics', active: false },
  { icon: ShieldCheck, label: 'Signals', active: false },
  { icon: ListFilter, label: 'Watchlist', active: false },
]

const CAT_ICONS: Record<string, string> = {
  pokemon: '⚡',
  basketball: '🏀',
  football: '🏈',
  baseball: '⚾',
  sports: '🏆',
}

function Sidebar({
  open,
  onClose,
  packs,
}: {
  open: boolean
  onClose: () => void
  packs: ReturnType<typeof useCourtyardData>['packs']
}) {
  const cats = ['pokemon', 'basketball', 'football', 'baseball', 'sports'] as const

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/70 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 lg:z-auto
          w-64 h-full flex flex-col flex-shrink-0
          glass border-r border-border/70
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-14 flex items-center justify-between px-5 border-b border-border/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary fill-current" />
            </div>
            <div>
              <span
                className="font-black text-lg tracking-tighter leading-none block"
                style={{
                  background: 'linear-gradient(135deg, hsl(162,72%,52%) 0%, hsl(162,72%,70%) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                PackPulse
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted/50 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 px-3 mb-2">
            Workspace
          </p>

          <div className="space-y-0.5">
            {NAV.map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  item.active
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                <span className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </span>
                {item.active && <ChevronRight className="w-3 h-3 opacity-50" />}
              </button>
            ))}
          </div>

          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 px-3 mt-5 mb-2">
            Categories
          </p>

          <div className="space-y-0.5">
            {cats.map((cat) => {
              const count = packs.filter((p) => p.category === cat).length
              const posCount = packs.filter((p) => p.category === cat && p.evRatio >= 1).length

              return (
                <button
                  key={cat}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all font-medium"
                >
                  <span className="flex items-center gap-2.5">
                    <span>{CAT_ICONS[cat]}</span>
                    <span className="capitalize">{cat}</span>
                  </span>

                  <span className="flex items-center gap-1">
                    {posCount > 0 && (
                      <span className="text-[9px] font-black bg-primary/15 text-primary px-1.5 rounded">
                        {posCount}+EV
                      </span>
                    )}
                    <span className="text-[10px] font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                      {count}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-border/60 flex-shrink-0 space-y-3">
          <a
            href="https://courtyard.io/vending-machine/mystery-pack-machine"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-border/60 text-[11px] font-black text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Courtyard.io
          </a>

          <div className="flex items-center gap-3 bg-muted/20 rounded-xl p-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-black text-primary">PP</span>
            </div>
            <div>
              <p className="text-xs font-bold">PackPulse User</p>
              <p className="text-[10px] text-muted-foreground font-mono">Pro Preview</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

function HeroCard({ pack }: { pack: ReturnType<typeof useCourtyardData>['bestPack'] }) {
  if (!pack) return null

  return (
    <div className="glass rounded-xl p-5 border border-primary/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
            Best Value Right Now
          </span>
          <span className="text-[10px] font-black px-2 py-0.5 rounded border sig-great">
            GREAT VALUE
          </span>
        </div>

        <p className="font-black text-lg leading-tight mb-3">{pack.name}</p>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
              EV Ratio
            </p>
            <p className="font-black text-2xl font-mono tabular ev-great">
              {pack.evRatio.toFixed(3)}
            </p>
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
              EV
            </p>
            <p className="font-black text-2xl font-mono tabular ev-positive">
              ${pack.calibratedEv.toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
              Pack Price
            </p>
            <p className="font-black text-2xl font-mono tabular">
              ${pack.price.toFixed(2)}
            </p>
          </div>
        </div>

        <a
          href="https://courtyard.io/vending-machine/mystery-pack-machine"
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex items-center gap-1.5 text-xs font-black text-primary hover:underline"
        >
          View Pack
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}

function RecentPullsGrid({
  pulls,
}: {
  pulls: ReturnType<typeof useCourtyardData>['livePulls']
}) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border/60 flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest">Recent Pulls</span>
        <span className="text-[10px] text-muted-foreground">Sample tracked pack outcomes</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-0">
        {pulls.slice(0, 10).map((pull, i) => (
          <motion.div
            key={pull.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="relative group border-r border-b border-border/40 last:border-r-0 hover:bg-primary/5 transition-colors cursor-default"
          >
            <div className="aspect-[3/4] relative overflow-hidden bg-secondary/30">
              <img
                src={pull.imageUrl}
                alt={pull.cardName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const el = e.target as HTMLImageElement
                  el.src =
                    'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=200&q=60'
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-[10px] font-black text-white leading-tight line-clamp-2">
                  {pull.cardName}
                </p>
                <p
                  className={`text-xs font-black font-mono tabular mt-0.5 ${
                    pull.profit >= 0 ? 'text-primary' : 'text-red-400'
                  }`}
                >
                  ${pull.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-[9px] text-white/50">from a ${pull.packPrice} pack</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { packs, livePulls, totalPulls, posEV, avgEV, bestPack, lastUpdated } =
    useCourtyardData()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'hsl(218,44%,3.5%)' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} packs={packs} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-border/60 bg-card/30 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Menu className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex items-center gap-2 lg:hidden">
              <Zap className="w-4 h-4 text-primary fill-current" />
              <span
                className="font-black text-base tracking-tighter"
                style={{
                  background: 'linear-gradient(135deg, hsl(162,72%,52%) 0%, hsl(162,72%,70%) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                PackPulse
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
              <span className="live-dot" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                Updated
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-4 text-[11px]">
              <span className="text-muted-foreground font-mono tabular">
                <span className="text-primary font-black">{posEV}</span>/{packs.length} +EV
              </span>
              <span className="text-muted-foreground font-mono tabular">
                <span className="text-foreground font-black">{totalPulls.toLocaleString()}</span>{' '}
                pulls
              </span>
              <span className="text-muted-foreground font-mono tabular">
                avg{' '}
                <span className={`font-black ${avgEV >= 1 ? 'text-primary' : 'text-yellow-400'}`}>
                  {avgEV.toFixed(3)}x
                </span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                <Bell className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
              </button>

              <div
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border/50 transition-colors"
                title={
                  lastUpdated
                    ? `Last updated: ${new Date(lastUpdated).toLocaleString()}`
                    : 'No update time available'
                }
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </header>

        <LiveTicker pulls={livePulls} />

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-[1400px] mx-auto p-4 lg:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1
                    className="text-2xl lg:text-3xl font-black tracking-tight leading-none"
                    style={{
                      background: 'linear-gradient(135deg, hsl(162,72%,52%) 0%, #fff 60%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Stop buying packs blind.
                  </h1>

                  <p className="text-sm text-muted-foreground mt-1.5 font-medium">
                    Track expected value for Courtyard mystery packs with clean rankings, sample
                    pull data, and clearer signals before you buy.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="https://courtyard.io/vending-machine/mystery-pack-machine"
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-black flex items-center gap-2 hover:bg-primary/80 transition-colors"
                  >
                    View Packs
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <StatsBar
                packs={packs}
                totalPulls={totalPulls}
                posEV={posEV}
                avgEV={avgEV}
                bestPack={bestPack}
              />

              <HeroCard pack={bestPack} />

              <div className="glass rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border/60 bg-card/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    <span className="font-black text-sm uppercase tracking-widest">Pack Monitor</span>
                    <span className="text-[10px] text-muted-foreground hidden sm:block font-mono">
                      {packs.length} packs · sorted by EV ratio
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="live-dot" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                      Stable Data
                    </span>
                  </div>
                </div>

                <PackTable packs={packs} />
              </div>

              <RecentPullsGrid pulls={livePulls} />

              <div className="text-center py-6 border-t border-border/40 space-y-2">
                <p className="text-xs text-muted-foreground/60">
                  Not affiliated with Courtyard.io. For informational purposes only.
                </p>
                <p className="text-[10px] text-muted-foreground/40">
                  © 2026 PackPulse · {totalPulls.toLocaleString()} pulls tracked
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
