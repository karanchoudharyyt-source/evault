import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { getLivePacks, REAL_PULLS, type Pack, type PullRecord } from '@/data/packs'

export type { Pack, PullRecord }

export function useCourtyardData() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 8000)
    return () => clearInterval(id)
  }, [])

  const { data: packs = getLivePacks(0) } = useQuery({
    queryKey: ['packs', tick],
    queryFn: () => getLivePacks(tick),
    staleTime: 7500,
    refetchOnWindowFocus: false,
  })

  const { data: livePulls = REAL_PULLS } = useQuery({
    queryKey: ['pulls', tick],
    queryFn: () => {
      if (tick % 2 === 0) {
        const r = [...REAL_PULLS]
        const last = r.pop()!
        r.unshift({ ...last, id: String(Date.now()) })
        return r
      }
      return REAL_PULLS
    },
    staleTime: 7500,
    refetchOnWindowFocus: false,
  })

  const totalPulls = packs.reduce((s, p) => s + p.totalPulls, 0)
  const posEV = packs.filter(p => p.evRatio >= 1).length
  const avgEV = packs.reduce((s, p) => s + p.evRatio, 0) / packs.length
  const bestPack = [...packs].sort((a, b) => b.evRatio - a.evRatio)[0]

  return { packs, livePulls, totalPulls, posEV, avgEV, bestPack, tick }
}
