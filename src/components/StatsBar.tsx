import React from 'react'
import { TrendingUp, Package, Zap, BarChart3 } from 'lucide-react'
import type { Pack } from '@/data/packs'

interface Props {
  packs: Pack[]
  totalPulls: number
  posEV: number
  avgEV: number
  bestPack: Pack | null
}

export default function StatsBar({ packs, totalPulls, posEV, avgEV, bestPack }: Props) {
  const stats = [
    {
      icon: Zap,
      label: '+EV Packs',
      value: `${posEV}/${packs.length}`,
      sub: 'above break-even EV',
      color: 'ev-positive',
    },
    {
      icon: TrendingUp,
      label: 'Best EV Right Now',
      value: bestPack ? `${bestPack.evRatio.toFixed(3)}x` : '—',
      sub: bestPack ? bestPack.name : 'No pack data',
      color: 'ev-great',
    },
    {
      icon: Package,
      label: 'Pulls Tracked',
      value: totalPulls.toLocaleString(),
      sub: 'tracked sample volume',
      color: 'text-blue-400',
    },
    {
      icon: BarChart3,
      label: 'Market Avg EV',
      value: `${avgEV.toFixed(3)}x`,
      sub: avgEV >= 1.2 ? 'Market is strong' : avgEV >= 1.0 ? 'Market is healthy' : 'Market is soft',
      color: avgEV >= 1.0 ? 'ev-positive' : 'ev-neutral',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="glass rounded-xl p-4 flex items-start gap-3 hover:border-primary/25 transition-all animate-in"
          style={{ animationDelay: `${i * 0.07}s` }}
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0">
            <stat.icon className="w-4 h-4 text-primary" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-0.5">
              {stat.label}
            </p>
            <p className={`font-black text-xl font-mono tabular tracking-tight leading-none ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">{stat.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
