import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react'
import type { Pack } from '@/data/packs'

/* ── Signal badge ── */
const SIG_CLASS: Record<Pack['signal'], string> = {
  'GREAT VALUE': 'sig-great',
  'GOOD VALUE':  'sig-good',
  'FAIR VALUE':  'sig-fair',
  'BELOW EV':    'sig-below',
}

function evColor(r: number) {
  if (r >= 1.3) return 'ev-great'
  if (r >= 1.0) return 'ev-good'
  if (r >= 0.9) return 'ev-fair'
  return 'ev-below'
}

/* ── Mini sparkline SVG ── */
function Spark({ data, up }: { data: number[]; up: boolean }) {
  const W = 60, H = 22
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 0.001
  const pts = data.map((v, i) =>
    `${((i / (data.length - 1)) * W).toFixed(1)},${(H - ((v - min) / range) * H * 0.85 - 2).toFixed(1)}`
  ).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <polyline fill="none"
        className={up ? 'spark-up' : 'spark-down'}
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        points={pts} />
    </svg>
  )
}

/* ── Pool bar ── */
function PoolBar({ remaining, total }: { remaining: number; total: number }) {
  const pct = Math.min((remaining / total) * 100, 100)
  const color = pct < 20 ? 'bg-red-500' : pct < 50 ? 'bg-yellow-500' : 'bg-primary'
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="flex-1 h-1 rounded-full bg-border/60 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground tabular whitespace-nowrap">
        {remaining}/{total}
      </span>
    </div>
  )
}

type SortKey = 'evRatio' | 'calibratedEv' | 'price' | 'winRateAbovePackPrice' | 'buybackMultiplier' | 'totalPulls'
type FilterEV = 'all' | 'positive' | 'negative'
type Category = 'All' | 'pokemon' | 'basketball' | 'football' | 'baseball' | 'sports'

const CAT_ICONS: Record<string, string> = {
  pokemon: '⚡', basketball: '🏀', football: '🏈', baseball: '⚾', sports: '🏆',
}
const CAT_TAG: Record<string, string> = {
  pokemon: 'PKMN', basketball: 'NBA', football: 'NFL', baseball: 'MLB', sports: 'SPORT',
}

interface Props { packs: Pack[] }

export default function PackTable({ packs }: Props) {
  const [sortKey, setSortKey]   = useState<SortKey>('evRatio')
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('desc')
  const [filterEV, setFilterEV] = useState<FilterEV>('all')
  const [cat, setCat]           = useState<Category>('All')
  const [search, setSearch]     = useState('')

  const CATS: Category[] = ['All', 'pokemon', 'basketball', 'football', 'baseball', 'sports']

  const sorted = [...packs]
    .filter(p => filterEV === 'positive' ? p.evRatio >= 1 : filterEV === 'negative' ? p.evRatio < 1 : true)
    .filter(p => cat === 'All' || p.category === cat)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortKey] as number, bv = b[sortKey] as number
      return sortDir === 'desc' ? bv - av : av - bv
    })

  function handleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(k); setSortDir('desc') }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <Minus className="w-3 h-3 opacity-20" />
    return sortDir === 'desc'
      ? <ChevronDown className="w-3 h-3 text-primary" />
      : <ChevronUp className="w-3 h-3 text-primary" />
  }

  return (
    <div>
      {/* Controls */}
      <div className="px-5 py-3.5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap bg-card/20">
        {/* EV filter */}
        <div className="flex items-center gap-1">
          {(['all', 'positive', 'negative'] as FilterEV[]).map(f => (
            <button key={f} onClick={() => setFilterEV(f)}
              className={`h-7 px-3 rounded-md text-[11px] font-bold transition-all ${
                filterEV === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}>
              {f === 'positive' ? '+EV Only' : f === 'negative' ? '−EV Only' : 'All Packs'}
            </button>
          ))}
        </div>
        {/* Category filter */}
        <div className="flex items-center gap-1 flex-wrap">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`h-7 px-2.5 rounded-md text-[11px] font-bold transition-all ${
                cat === c
                  ? 'bg-secondary text-foreground border border-primary/30'
                  : 'bg-secondary/30 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/50'
              }`}>
              {c === 'All' ? `All (${packs.length})` : `${CAT_ICONS[c]} ${c.charAt(0).toUpperCase() + c.slice(1)}`}
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="sm:ml-auto">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search packs…"
            className="bg-secondary/40 border border-border/60 text-sm rounded-lg px-3 py-1.5 w-44 focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 bg-card/30">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 w-8">#</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Pack</th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('price')}>
                <span className="flex items-center justify-end gap-1">Price <SortIcon col="price" /></span>
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('evRatio')}>
                <span className="flex items-center justify-end gap-1">EV Ratio <SortIcon col="evRatio" /></span>
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('calibratedEv')}>
                <span className="flex items-center justify-end gap-1">Cal. EV <SortIcon col="calibratedEv" /></span>
              </th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 cursor-pointer hover:text-primary transition-colors min-w-[140px]" onClick={() => handleSort('winRateAbovePackPrice')}>
                <span className="flex items-center gap-1">Win Rate <SortIcon col="winRateAbovePackPrice" /></span>
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('buybackMultiplier')}>
                <span className="flex items-center justify-center gap-1">Buyback <SortIcon col="buybackMultiplier" /></span>
              </th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hidden lg:table-cell">Pool</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hidden md:table-cell">Trend</th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Signal</th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Action</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {sorted.map((p, i) => {
                const up = p.trend[p.trend.length - 1] >= p.trend[0]
                return (
                  <motion.tr key={p.id} layout
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, delay: i * 0.025 }}
                    className="pack-row border-b border-border/30">
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-sm font-black text-muted-foreground/40 tabular">#{p.rank}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-secondary/50 border border-border/50">
                          <img src={p.imageUrl} alt={p.name}
                            className="w-full h-full object-cover"
                            onError={e => {
                              const el = e.target as HTMLImageElement
                              el.style.display = 'none'
                              const par = el.parentElement
                              if (par) par.innerHTML = `<div class="w-full h-full flex items-center justify-center text-[9px] font-black text-primary">${CAT_TAG[p.category] || '?'}</div>`
                            }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm pack-name">{p.name}</span>
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground">{CAT_TAG[p.category]}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            <span className="font-mono tabular">{p.totalPulls.toLocaleString()}</span> pulls ·{' '}
                            <span className="text-foreground/50 truncate" style={{ maxWidth: 140, display: 'inline-block', verticalAlign: 'bottom' }}>{p.topCard}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-mono font-bold text-sm tabular">${p.price.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className={`font-mono text-xl font-black tabular leading-none ${evColor(p.evRatio)}`}>
                          {p.evRatio.toFixed(3)}
                        </span>
                        <div className="flex items-center gap-1">
                          {up ? <TrendingUp className="w-3 h-3 ev-positive" /> : <TrendingDown className="w-3 h-3 ev-negative" />}
                          <span className="text-[10px] text-muted-foreground font-mono">x EV</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`font-mono font-black text-sm tabular ${evColor(p.evRatio)}`}>
                        ${p.calibratedEv.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 min-w-[140px]">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-muted-foreground">Win rate</span>
                          <span className="font-mono tabular">{p.winRateAbovePackPrice.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-border/60 overflow-hidden w-full">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(p.winRateAbovePackPrice * 4.2, 100)}%` }}
                            transition={{ duration: 0.8, delay: i * 0.04 }}
                            className={`h-full rounded-full ${p.evRatio >= 1 ? 'bg-primary' : 'bg-yellow-500'}`}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-sm font-mono font-black tabular ${p.buybackMultiplier >= 1 ? 'ev-positive' : 'text-muted-foreground'}`}>
                        {p.buybackMultiplier.toFixed(3)}x
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <PoolBar remaining={p.remaining} total={p.totalSlots} />
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Spark data={p.trend} up={up} />
                        {up
                          ? <TrendingUp className="w-3 h-3 ev-positive flex-shrink-0" />
                          : <TrendingDown className="w-3 h-3 ev-negative flex-shrink-0" />}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border whitespace-nowrap ${SIG_CLASS[p.signal]}`}>
                        {p.signal}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <a href="https://courtyard.io/vending-machine/mystery-pack-machine" target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-primary/30 text-primary text-[11px] font-black hover:bg-primary/10 hover:border-primary transition-all">
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <p className="font-bold">No packs match your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
