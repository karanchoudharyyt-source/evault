import React from 'react'
import { RECENT_PULLS } from '@/data/packs'

const EMOJIS: Record<string, string> = { Basketball: '🏀', Pokémon: '⚡', Football: '🏈', Baseball: '⚾', Sports: '🏆' }

export default function LiveTicker() {
  const doubled = [...RECENT_PULLS, ...RECENT_PULLS]
  return (
    <div className="relative border-b border-border bg-card/30 backdrop-blur-sm overflow-hidden h-10 flex items-center flex-shrink-0">
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, hsl(220,40%,7%) 0%, transparent 100%)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, hsl(220,40%,7%) 0%, transparent 100%)' }} />
      <div className="flex items-center gap-2 px-4 border-r border-border/50 flex-shrink-0 z-20 bg-card/80 h-full">
        <span className="relative live-dot flex-shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground whitespace-nowrap">Live Pulls</span>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="ticker-track items-center gap-0">
          {doubled.map((pull, i) => (
            <div key={`${pull.id}-${i}`} className="flex items-center gap-2 px-4 h-10 border-r border-border/20 flex-shrink-0">
              <span className="text-sm">{EMOJIS[pull.packName.split(' ')[0]] || '🎴'}</span>
              <span className="text-xs font-bold text-foreground whitespace-nowrap">{pull.cardName}</span>
              <span className={`text-xs font-mono font-bold whitespace-nowrap ${pull.profit >= 0 ? 'ev-positive' : 'ev-negative'}`}>
                ${pull.value.toFixed(0)}
                <span className="text-[10px] ml-1 opacity-70">({pull.profit >= 0 ? '+' : ''}${pull.profit.toFixed(0)})</span>
              </span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">@{pull.userName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
