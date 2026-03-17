import React from 'react'
import type { PullRecord } from '@/data/packs'

const RARITY_COLOR: Record<string, string> = {
  legendary: 'text-yellow-400',
  rare:      'text-blue-400',
  uncommon:  'text-purple-400',
  common:    'text-muted-foreground',
}

interface Props { pulls: PullRecord[] }

export default function LiveTicker({ pulls }: Props) {
  const items = [...pulls, ...pulls] // doubled for seamless loop

  return (
    <div className="relative border-b border-border bg-card/40 backdrop-blur-md overflow-hidden h-10 flex-shrink-0 flex items-center">
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, hsl(218,44%,4%) 0%, transparent 100%)' }} />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, hsl(218,44%,4%) 0%, transparent 100%)' }} />

      {/* Live badge */}
      <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center gap-2 px-4 bg-card/90 border-r border-border/60 flex-shrink-0">
        <span className="live-dot" />
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground whitespace-nowrap">Live Pulls</span>
      </div>

      {/* Scrolling track */}
      <div className="ticker-wrap flex-1 ml-[110px]">
        <div className="ticker-track items-center">
          {items.map((pull, i) => (
            <div key={`${pull.id}-${i}`}
              className="flex items-center gap-2.5 px-5 h-10 border-r border-border/20 flex-shrink-0 group hover:bg-primary/5 transition-colors cursor-default">
              {pull.imageUrl && (
                <img src={pull.imageUrl} alt=""
                  className="w-5 h-7 object-cover rounded-sm opacity-80 group-hover:opacity-100 transition-opacity"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              )}
              <span className={`text-[11px] font-bold whitespace-nowrap ${RARITY_COLOR[pull.rarity]}`}>
                {pull.cardName}
              </span>
              <span className={`text-[11px] font-mono font-black whitespace-nowrap ${pull.profit >= 0 ? 'ev-positive' : 'ev-negative'}`}>
                ${pull.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                ({pull.profit >= 0 ? '+' : ''}${pull.profit.toFixed(0)})
              </span>
              <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">@{pull.userName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
