import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Zap, TrendingUp, ShieldCheck, Activity, Brain, LayoutGrid, ListFilter, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePulseData } from '@/hooks/use-pulse-data'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const EVBadge = ({ value, price }: { value: number, price: number }) => {
  const ratio = value / price
  const isPositive = ratio >= 1
  return (
    <Badge className={`${isPositive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} border-none font-mono font-bold`}>
      {ratio.toFixed(3)}x
    </Badge>
  )
}

const PackIcon = ({ category }: { category: string }) => {
  switch (category.toLowerCase()) {
    case 'pokemon': return '🃏'
    case 'sports': return '🏀'
    case 'magic': return '✨'
    case 'baseball': return '⚾'
    default: return '📦'
  }
}

const AIPulseAssistant = () => {
  return (
    <Card className="glass-card flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border/50 flex items-center gap-2">
        <Brain className="w-4 h-4 text-primary animate-pulse" />
        <span className="font-bold text-sm tracking-tight">AI PULSE STRATEGIST</span>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 text-sm">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-primary-foreground font-medium mb-1">MARKET ALPHA ALERT</p>
            <p className="text-xs text-muted-foreground">
              3 of the top 5 Pokémon Grails are still in the current pool. With only 15% of packs remaining, statistical ROI is at its daily peak.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase">Hot Opportunities</p>
            <div className="bg-secondary/50 rounded-lg p-2 flex items-center justify-between">
              <span className="text-xs font-mono">Basketball Pro</span>
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30">+1.67x EV</Badge>
            </div>
          </div>
        </div>
      </ScrollArea>
      <div className="p-4 bg-muted/30 border-t border-border/50">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 w-3 h-3 text-muted-foreground" />
          <input 
            placeholder="Ask the strategist..." 
            className="w-full bg-background/50 border border-border/50 rounded-md py-2 pl-7 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>
    </Card>
  )
}

const LivePullFeed = ({ pulls }: { pulls: any[] }) => {
  return (
    <div className="w-full bg-card/30 backdrop-blur-md border-b border-border/50 h-16 flex items-center overflow-hidden">
      <div className="flex items-center gap-2 px-4 whitespace-nowrap overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 pr-4 border-r border-border/50">
          <Activity className="w-3 h-3 text-red-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live Pulse</span>
        </div>
        <AnimatePresence mode="popLayout">
          {pulls.map((pull, i) => (
            <motion.div 
              key={pull.id || i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 group hover:border-primary/50 transition-colors"
            >
              <div className="w-6 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
                <img src={pull.imageUrl || 'https://via.placeholder.com/24x32'} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold truncate max-w-[80px]">{pull.cardName}</span>
                <span className="text-[9px] font-mono text-primary font-bold">${pull.value.toFixed(2)}</span>
              </div>
              <span className="text-[8px] text-muted-foreground ml-1">@{pull.userName}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

const Sidebar = () => {
  return (
    <aside className="w-16 lg:w-64 h-full flex flex-col border-r border-border/50 glass-card z-20 transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-border/50">
        <Zap className="w-6 h-6 text-primary fill-primary glow" />
        <span className="ml-3 font-black text-xl tracking-tighter hidden lg:block italic">PulseAI</span>
      </div>
      <div className="flex-1 py-6 px-3 space-y-2">
        {[
          { icon: LayoutGrid, label: 'Terminal', active: true },
          { icon: TrendingUp, label: 'Analytics', active: false },
          { icon: ShieldCheck, label: 'Buyback Pulse', active: false },
          { icon: ListFilter, label: 'Alpha Scanner', active: false },
        ].map((item, i) => (
          <Button 
            key={i} 
            variant={item.active ? 'secondary' : 'ghost'} 
            className={`w-full justify-start gap-3 h-11 ${item.active ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground'}`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-bold text-sm hidden lg:block tracking-tight">{item.label}</span>
          </Button>
        ))}
      </div>
      <div className="p-4 border-t border-border/50">
        <div className="lg:flex items-center gap-3 hidden">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <span className="text-xs font-bold text-primary">JD</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold">Collector Alpha</span>
            <span className="text-[10px] text-muted-foreground">Pro Member</span>
          </div>
        </div>
        <div className="lg:hidden flex justify-center">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <span className="text-xs font-bold text-primary">JD</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

const Terminal = () => {
  const { data, isLoading } = usePulseData()

  // Fallback mock data if DB is empty
  const packs = data?.packs?.length ? data.packs : [
    { id: '1', name: 'Basketball Pro Pack', category: 'sports', price: 50, currentEv: 83.72, winRate: 16.5, buybackRatio: 1.2, totalPulls: 2145, updatedAt: new Date().toISOString() },
    { id: '2', name: 'Pokémon Starter Pack', category: 'pokemon', price: 25, currentEv: 30.62, winRate: 12.2, buybackRatio: 0.9, totalPulls: 4277, updatedAt: new Date().toISOString() },
    { id: '3', name: 'Magic: The Gathering Master', category: 'magic', price: 100, currentEv: 117.15, winRate: 8.5, buybackRatio: 1.1, totalPulls: 984, updatedAt: new Date().toISOString() },
    { id: '4', name: 'Baseball Rookie Pack', category: 'baseball', price: 15, currentEv: 14.80, winRate: 20.1, buybackRatio: 0.8, totalPulls: 6512, updatedAt: new Date().toISOString() },
  ]

  const pulls = data?.pulls?.length ? data.pulls : [
    { id: '1', cardName: 'Charizard V', value: 40, imageUrl: '', userName: 'besticeman' },
    { id: '2', cardName: 'Lugia GX', value: 12.60, imageUrl: '', userName: 'cosmicdemon' },
    { id: '3', cardName: 'Cassiopeia', value: 43.30, imageUrl: '', userName: 'goldsports' },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617] text-foreground selection:bg-primary selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <LivePullFeed pulls={pulls} />
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto overflow-x-hidden scrollbar-hide">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-2 italic uppercase">
                  Alpha Terminal
                  <Badge variant="outline" className="text-primary border-primary animate-pulse ml-2 text-[10px] tracking-widest font-black uppercase">LIVE</Badge>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Real-time Expected Value tracking for Courtyard.io mystery packs.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-secondary/50 rounded-lg px-4 py-2 border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Global Pull Volume</span>
                  <span className="text-sm font-mono font-black">3,974,863</span>
                </div>
                <div className="bg-secondary/50 rounded-lg px-4 py-2 border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">+EV Packs Detected</span>
                  <span className="text-sm font-mono font-black text-primary">12</span>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Market Hotness', value: 'High', icon: Activity, color: 'text-orange-500' },
                { label: 'Avg Buyback Ratio', value: '1.08x', icon: ShieldCheck, color: 'text-primary' },
                { label: 'Pool Depletion', value: '14.2%', icon: TrendingUp, color: 'text-blue-500' },
                { label: 'Signals Today', value: '24', icon: Zap, color: 'text-yellow-500' },
              ].map((stat, i) => (
                <Card key={i} className="glass-card p-4 hover:border-primary/30 transition-all group">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`w-4 h-4 ${stat.color} group-hover:scale-110 transition-transform`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-black font-mono tracking-tighter">{stat.value}</div>
                </Card>
              ))}
            </div>

            <Card className="glass-card overflow-hidden">
              <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-sm tracking-tight uppercase italic">Active Alpha Scan</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase tracking-wider px-2 border border-border/50">All Categories</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase tracking-wider px-2">+EV ONLY</Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-mono">SORT: EV RATIO ↕</span>
                </div>
              </div>
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="w-[280px] text-[10px] font-black uppercase tracking-widest">Pack Information</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Price</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">EV Ratio</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Calibrated EV</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Win Rate</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Buyback ROI</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packs.map((pack) => (
                    <TableRow key={pack.id} className="border-border/50 hover:bg-muted/30 transition-colors group">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110"><PackIcon category={pack.category} /></span>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">{pack.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{pack.category} · {pack.totalPulls} Pulls tracked</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-bold">${pack.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right"><EVBadge value={pack.currentEv} price={pack.price} /></TableCell>
                      <TableCell className="text-right font-mono text-sm font-black text-primary">${pack.currentEv.toFixed(2)}</TableCell>
                      <TableCell className="min-w-[120px]">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                            <span>{pack.winRate}% Hit chance</span>
                          </div>
                          <Progress value={pack.winRate} className="h-1 bg-muted/50" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-xs font-bold font-mono ${pack.buybackRatio >= 1 ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {pack.buybackRatio.toFixed(2)}x
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="h-8 font-black text-[10px] uppercase tracking-widest pulse-glow">View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
          <aside className="w-80 border-l border-border/50 p-4 hidden xl:block">
            <AIPulseAssistant />
          </aside>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Terminal />
    </div>
  )
}
