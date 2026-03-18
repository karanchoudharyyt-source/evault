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

                  <span className="flex items-center gap-1
