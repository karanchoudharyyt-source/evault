import { useQuery } from '@tanstack/react-query'
import { getPacks, getRecentPulls, type Pack, type PullRecord } from '@/data/packs'

export type { Pack, PullRecord }

export function useCourtyardData() {
  const { data: packs = [] } = useQuery({
    queryKey: ['packs'],
    queryFn: async () => getPacks(),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

  const { data: livePulls = [] } = useQuery({
    queryKey: ['recent-pulls'],
    queryFn: async () => getRecentPulls(),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

  const totalPulls = packs.reduce((sum, pack) => sum + pack.totalPulls, 0)
  const posEV = packs.filter(pack => pack.evRatio >= 1).length
  const avgEV = packs.length > 0
    ? packs.reduce((sum, pack) => sum + pack.evRatio, 0) / packs.length
    : 0

  const bestPack = packs.length > 0
    ? [...packs].sort((a, b) => b.evRatio - a.evRatio)[0]
    : null

  const lastUpdated = packs.length > 0
    ? packs[0].lastUpdated
    : null

  return {
    packs,
    livePulls,
    totalPulls,
    posEV,
    avgEV,
    bestPack,
    lastUpdated,
  }
}
