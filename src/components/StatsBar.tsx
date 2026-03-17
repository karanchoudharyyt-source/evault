import React from 'react'
import { PACKS } from '@/data/packs'
import { TrendingUp, Package, Zap, BarChart3 } from 'lucide-react'

export default function StatsBar() {
  const topPack = [...PACKS].sort((a, b) => b.evRatio - a.evRatio)[0]
  const pos = PACKS.filter(p => p.evRatio >= 1)
  const totalPulls = PACKS.reduce((s, p) => s + p.totalPulls, 0)
  const avg = PACKS.reduce((s, p) => s + p.evRatio, 0) / PACKS.length
  const stats = [
    { icon: Zap, label: '+EV Packs', value: `${pos.length}/${PACKS.length}`, sub: 'above break-even', color: 'text-primary' },
    { icon: TrendingUp, label: 'Best EV Right Now', value: `${topPack.evRatio.toFixed(3)}x`, sub: topPack.name, color: 'ev-positive' },
    { icon: Package, label: 'Pulls Tracked', value: totalPulls.toLocaleString(), sub: 'and counting', color: 'text-blue-400' },
    { icon: BarChart3, label: 'Market Avg EV', value: `${avg.toFixed(3)}x`, sub: avg >= 1 ? 'Market is HOT 🔥' : 'Market is cool', color: avg >= 1 ? 'ev-positive' : 'ev-neutral' },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <div key={i} className="glass rounded-xl p-4 flex items-start gap-3 hover:border-primary/20 transition-all animate-in" style={{ animationDelay: `${i * 0.08}s` }}>
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/10 flex items-center justify-center flex-shrink-0">
            <s.icon className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">{s.label}</div>
            <div className={`font-black text-xl font-mono tracking-tight leading-none ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-1 truncate">{s.sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
