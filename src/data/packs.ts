export interface Pack {
  id: string
  rank: number
  slug: string
  name: string
  category: 'pokemon' | 'basketball' | 'football' | 'baseball' | 'sports'
  price: number
  imageUrl: string
  calibratedEv: number
  evRatio: number
  buybackEv: number
  buybackMultiplier: number
  winRateAbovePackPrice: number
  totalPulls: number
  remaining: number
  totalSlots: number
  signal: 'GREAT VALUE' | 'GOOD VALUE' | 'FAIR VALUE' | 'BELOW EV'
  topCard: string
  topCardValue: number
  trend: number[]
  lastUpdated: string
}

export interface PullRecord {
  id: string
  cardName: string
  packName: string
  packPrice: number
  value: number
  profit: number
  imageUrl: string
  userName: string
  rarity: 'legendary' | 'rare' | 'uncommon' | 'common'
  pulledAt: string
}

const LAST_UPDATED = '2026-03-18T18:30:00.000Z'

export const PACKS: Pack[] = [
  {
    id: 'basketball-pro',
    rank: 1,
    slug: 'basketball-pro-pack',
    name: 'Basketball Pro Pack',
    category: 'basketball',
    price: 50,
    imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=80&q=80',
    calibratedEv: 83.72,
    evRatio: 1.674,
    buybackEv: 67.2,
    buybackMultiplier: 1.344,
    winRateAbovePackPrice: 22.5,
    totalPulls: 2145,
    remaining: 312,
    totalSlots: 500,
    signal: 'GREAT VALUE',
    topCard: 'LeBron James Auto /99',
    topCardValue: 850,
    trend: [1.44, 1.51, 1.58, 1.61, 1.64, 1.67, 1.674],
    lastUpdated: LAST_UPDATED,
  },
  {
    id: 'basketball-master',
    rank: 2,
    slug: 'basketball-master-pack',
    name: 'Basketball Master Pack',
    category: 'basketball',
    price: 100,
    imageUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=80&q=80',
    calibratedEv: 146.91,
    evRatio: 1.469,
    buybackEv: 112.4,
    buybackMultiplier: 1.124,
    winRateAbovePackPrice: 18.2,
    totalPulls: 984,
    remaining: 88,
    totalSlots: 200,
    signal: 'GREAT VALUE',
    topCard: 'Michael Jordan PSA 10',
    topCardValue: 2400,
    trend: [1.38, 1.4, 1.43, 1.45, 1.46, 1.47, 1.469],
    lastUpdated: LAST_UPDATED,
  },
  {
    id: 'pokemon-pro',
    rank: 3,
    slug: 'pokemon-pro-pack',
    name: 'Pokémon Pro Pack',
    category: 'pokemon',
    price: 50,
    imageUrl: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=80&q=80',
    calibratedEv: 65.45,
    evRatio: 1.309,
    buybackEv: 52.1,
    buybackMultiplier: 1.042,
    winRateAbovePackPrice: 14.8,
    totalPulls: 1540,
    remaining: 220,
    totalSlots: 400,
    signal: 'GREAT VALUE',
    topCard: 'Charizard Holo 1st Ed',
    topCardValue: 1200,
    trend: [1.22,
