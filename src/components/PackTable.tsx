import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { PackData } from '@/data/packs'

const SIG: Record<PackData['signal'], string> = {
  'GREAT VALUE': 'bg-primary/10 text-primary border-primary/30',
  'GOOD VALUE': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'FAIR VALUE': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  'BELOW EV': 'bg-red-500/10 text-red-400 border-red-500/30',
}
const ICONS: Record<string, string> = {
  Basketball: '🏀', Pokémon: '⚡', Football: '🏈', Baseball: '⚾', Sports: '🏆', Magic: '✨',
}

function Spark({ data }: { data: number[] }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 0.01
  const w = 56, h = 20
  const pts = data.map((v, i) =>
    `${((i / (data.length - 1)) * w).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`
  ).join(' ')
  const up = data[data.length - 1] >= data[0]
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline fill="none" stroke={up ? 'hsl(162 72% 45%)' : 'hsl(0 72% 60%)'} strokeWidth="1.5"
        points={pts} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PoolBar({ remaining, total }: { remaining: number; total: number }) {
  const pct = (remaining / total) * 100
  const color = pct < 20 ? 'bg-red-500' : pct < 50 ? 'bg-yellow-500' : 'bg-primary'
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{remaining}/{total}</span>
    </div>
  )
}

type SF = 'evRatio' | 'calibratedEv' | 'price' | 'winRate' | 'buybackRatio' | 'totalPulls'
type SD = 'asc' | 'desc'
type F = 'all' | 'positive' | 'negative'

export default function PackTable({ packs }: { packs: PackData[] }) {
  const [sort, setSort] = useState<SF>('evRatio')
  const [dir, setDir] = useState<SD>('desc')
  const [filter, setFilter] = useState<F>('all')
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')

  const cats = ['All', ...Array.from(new Set(packs.map(p => p.category)))]
  const sorted = [...packs]
    .filter(p => {
      if (filter === 'positive') return p.evRatio >= 1
      if (filter === 'negative') return p.evRatio < 1
      return true
    })
    .filter(p => cat === 'All' || p.category === cat)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sort] as number, bv = b[sort] as number
      return dir === 'desc' ? bv - av : av - bv
    })

  function hs(f: SF) {
    if (sort === f) setDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSort(f); setDir('desc') }
  }

  function Si({ f }: { f: SF }) {
    if (sort !== f) return <span className="ml-1 opacity-20">↕</span>
    return <span className="ml-1 ev-positive">{dir === 'desc' ? '↓' : '↑'}</span>
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-border/50 bg-card/20 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'positive', 'negative'] as F[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest border transition-all ${filter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}>
              {f === 'positive' ? '+EV Only' : f === 'negative' ? '−EV Only' : 'All Packs'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest border transition-all ${cat === c ? 'bg-secondary text-foreground border-primary/40' : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'}`}>
              {c === 'All' ? c : `${ICONS[c] || ''} ${c}`}
            </button>
          ))}
        </div>
        <div className="sm:ml-auto">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search packs..."
            className="bg-secondary/50 border border-border/50 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary/50 transition-colors w-48 placeholder:text-muted-foreground" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border/50 bg-card/50">
            <tr>
              <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-[260px]">Pack</th>
              <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => hs('price')}>Price <Si f="price" /></th>
              <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => hs('evRatio')}>EV Ratio <Si f="evRatio" /></th>
              <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => hs('calibratedEv')}>Cal. EV <Si f="calibratedEv" /></th>
              <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => hs('buybackRatio')}>Buyback <Si f="buybackRatio" /></th>
              <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => hs('winRate')}>Win Rate <Si f="winRate" /></th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pool</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trend</th>
              <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Signal</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {sorted.map((p, i) => (
                <motion.tr key={p.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, delay: i * 0.03 }} className="pack-row border-b border-border/30">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xl flex-shrink-0">{ICONS[p.category] || '📦'}</span>
                      <div>
                        <div className="font-bold text-sm pack-name transition-colors">{p.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono uppercase tracking-wide">{p.category} · {p.totalPulls.toLocaleString()} tracked</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold">${p.price}</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className={`font-mono font-black text-base ${p.evRatio >= 1.2 ? 'ev-positive' : p.evRatio >= 1 ? 'text-blue-400' : 'ev-negative'}`}>{p.evRatio.toFixed(3)}x</span>
                  </td>
                  <td className="px-4 py-3.5 text-right"><span className="font-mono font-bold ev-positive">${p.calibratedEv.toFixed(2)}</span></td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`font-mono font-bold text-xs ${p.buybackRatio >= 1 ? 'ev-positive' : 'text-muted-foreground'}`}>${p.buybackEv.toFixed(2)}</span>
                      <span className={`text-[10px] font-mono ${p.buybackRatio >= 1 ? 'ev-positive' : 'text-muted-foreground'}`}>{p.buybackRatio.toFixed(3)}x</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono font-bold text-xs">{p.winRate.toFixed(1)}%</span>
                      <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${Math.min(p.winRate, 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><PoolBar remaining={p.remaining} total={p.totalSlots} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Spark data={p.trend} />
                      {p.trend[p.trend.length - 1] > p.trend[0] ? <TrendingUp className="w-3 h-3 ev-positive flex-shrink-0" /> : p.trend[p.trend.length - 1] < p.trend[0] ? <TrendingDown className="w-3 h-3 ev-negative flex-shrink-0" /> : <Minus className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border whitespace-nowrap ${SIG[p.signal]}`}>{p.signal}</span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {sorted.length === 0 && <div className="text-center py-16 text-muted-foreground"><p className="font-bold text-sm">No packs match your filters</p></div>}
      </div>
    </div>
  )
}
