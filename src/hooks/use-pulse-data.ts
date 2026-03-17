import { useQuery } from '@tanstack/react-query'
import { blink } from '@/blink/client'

export interface Pack {
  id: string
  name: string
  category: string
  price: number
  currentEv: number
  winRate: number
  buybackRatio: number
  totalPulls: number
  updatedAt: string
}

export interface Pull {
  id: string
  packId: string
  cardName: string
  value: number
  imageUrl: string
  rarity: string
  userName: string
  createdAt: string
}

export const usePulseData = () => {
  return useQuery({
    queryKey: ['pulseData'],
    queryFn: async () => {
      // In a real app, this would fetch from our database (Supabase/Blink DB)
      // which is being updated by a background edge function or scraper.
      // For MVP, we fetch from our local table.
      const packs = await blink.db.packs.list({
        orderBy: { currentEv: 'desc' }
      }) as Pack[]

      const pulls = await blink.db.pulls.list({
        limit: 10,
        orderBy: { createdAt: 'desc' }
      }) as Pull[]

      return { packs, pulls }
    },
    refetchInterval: 5000 // Sub-5s real-time pulse as planned
  })
}
