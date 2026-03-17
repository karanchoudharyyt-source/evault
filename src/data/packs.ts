export interface Pack {
  id: string
  rank: number
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
}

function noise(base: number, pct = 0.015): number {
  return base * (1 + (Math.random() - 0.5) * pct)
}

export const BASE_PACKS: Pack[] = [
  {
    id: 'basketball-pro', rank: 1, name: 'Basketball Pro Pack',
    category: 'basketball', price: 50,
    imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=80&q=80',
    calibratedEv: 83.72, evRatio: 1.674,
    buybackEv: 67.20, buybackMultiplier: 1.344,
    winRateAbovePackPrice: 22.5, totalPulls: 2145,
    remaining: 312, totalSlots: 500, signal: 'GREAT VALUE',
    topCard: 'LeBron James Auto /99', topCardValue: 850,
    trend: [1.44, 1.51, 1.58, 1.61, 1.64, 1.67, 1.674],
  },
  {
    id: 'basketball-master', rank: 2, name: 'Basketball Master Pack',
    category: 'basketball', price: 100,
    imageUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=80&q=80',
    calibratedEv: 146.91, evRatio: 1.469,
    buybackEv: 112.40, buybackMultiplier: 1.124,
    winRateAbovePackPrice: 18.2, totalPulls: 984,
    remaining: 88, totalSlots: 200, signal: 'GREAT VALUE',
    topCard: 'Michael Jordan PSA 10', topCardValue: 2400,
    trend: [1.38, 1.40, 1.43, 1.45, 1.46, 1.47, 1.469],
  },
  {
    id: 'pokemon-pro', rank: 3, name: 'Pokémon Pro Pack',
    category: 'pokemon', price: 50,
    imageUrl: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=80&q=80',
    calibratedEv: 65.45, evRatio: 1.309,
    buybackEv: 52.10, buybackMultiplier: 1.042,
    winRateAbovePackPrice: 14.8, totalPulls: 1540,
    remaining: 220, totalSlots: 400, signal: 'GREAT VALUE',
    topCard: 'Charizard Holo 1st Ed', topCardValue: 1200,
    trend: [1.22, 1.24, 1.27, 1.29, 1.30, 1.31, 1.309],
  },
  {
    id: 'football-pro', rank: 4, name: 'Football Pro Pack',
    category: 'football', price: 50,
    imageUrl: 'https://images.unsplash.com/photo-1604284705462-83b14fd7c001?w=80&q=80',
    calibratedEv: 65.30, evRatio: 1.306,
    buybackEv: 51.80, buybackMultiplier: 1.036,
    winRateAbovePackPrice: 13.4, totalPulls: 551,
    remaining: 178, totalSlots: 300, signal: 'GREAT VALUE',
    topCard: 'Patrick Mahomes Auto /25', topCardValue: 780,
    trend: [1.18, 1.22, 1.25, 1.28, 1.30, 1.30, 1.306],
  },
  {
    id: 'pokemon-starter', rank: 5, name: 'Pokémon Starter Pack',
    category: 'pokemon', price: 25,
    imageUrl: 'https://images.unsplash.com/photo-1599153066269-50a50f80d5c4?w=80&q=80',
    calibratedEv: 30.62, evRatio: 1.225,
    buybackEv: 24.50, buybackMultiplier: 0.980,
    winRateAbovePackPrice: 12.2, totalPulls: 4277,
    remaining: 623, totalSlots: 1000, signal: 'GOOD VALUE',
    topCard: 'Mew V Alt Art', topCardValue: 290,
    trend: [1.14, 1.16, 1.18, 1.20, 1.21, 1.22, 1.225],
  },
  {
    id: 'pokemon-master', rank: 6, name: 'Pokémon Master Pack',
    category: 'pokemon', price: 100,
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=80&q=80',
    calibratedEv: 117.15, evRatio: 1.172,
    buybackEv: 89.20, buybackMultiplier: 0.892,
    winRateAbovePackPrice: 11.0, totalPulls: 984,
    remaining: 141, totalSlots: 300, signal: 'GOOD VALUE',
    topCard: 'Dialga G Crosshatch Holo', topCardValue: 1800,
    trend: [1.09, 1.11, 1.13, 1.15, 1.16, 1.17, 1.172],
  },
  {
    id: 'sports-platinum', rank: 7, name: 'Sports Platinum Pack',
    category: 'sports', price: 500,
    imageUrl: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?w=80&q=80',
    calibratedEv: 569.05, evRatio: 1.138,
    buybackEv: 442.50, buybackMultiplier: 0.885,
    winRateAbovePackPrice: 9.2, totalPulls: 74,
    remaining: 22, totalSlots: 50, signal: 'GOOD VALUE',
    topCard: 'Tom Brady 1/1 Auto', topCardValue: 12000,
    trend: [1.06, 1.08, 1.09, 1.10, 1.11, 1.13, 1.138],
  },
  {
    id: 'baseball-starter', rank: 8, name: 'Baseball Starter Pack',
    category: 'baseball', price: 25,
    imageUrl: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=80&q=80',
    calibratedEv: 24.50, evRatio: 0.980,
    buybackEv: 19.60, buybackMultiplier: 0.784,
    winRateAbovePackPrice: 8.4, totalPulls: 3210,
    remaining: 890, totalSlots: 1200, signal: 'FAIR VALUE',
    topCard: 'Shohei Ohtani RC Auto', topCardValue: 420,
    trend: [1.02, 1.01, 1.00, 0.99, 0.98, 0.98, 0.980],
  },
  {
    id: 'football-master', rank: 9, name: 'Football Master Pack',
    category: 'football', price: 100,
    imageUrl: 'https://images.unsplash.com/photo-1564429238817-393bd4286b2d?w=80&q=80',
    calibratedEv: 85.10, evRatio: 0.851,
    buybackEv: 68.00, buybackMultiplier: 0.680,
    winRateAbovePackPrice: 7.1, totalPulls: 312,
    remaining: 145, totalSlots: 250, signal: 'BELOW EV',
    topCard: 'Joe Burrow RPA /49', topCardValue: 540,
    trend: [0.91, 0.90, 0.89, 0.88, 0.87, 0.86, 0.851],
  },
  {
    id: 'baseball-pro', rank: 10, name: 'Baseball Pro Pack',
    category: 'baseball', price: 50,
    imageUrl: 'https://images.unsplash.com/photo-1582650949431-adbe9b7bfaef?w=80&q=80',
    calibratedEv: 41.20, evRatio: 0.824,
    buybackEv: 32.90, buybackMultiplier: 0.658,
    winRateAbovePackPrice: 6.8, totalPulls: 1890,
    remaining: 430, totalSlots: 600, signal: 'BELOW EV',
    topCard: 'Mike Trout Auto /150', topCardValue: 380,
    trend: [0.87, 0.86, 0.85, 0.84, 0.83, 0.83, 0.824],
  },
]

// Live-like noise applied on each tick
export function getLivePacks(tick: number): Pack[] {
  return BASE_PACKS.map((p, i) => ({
    ...p,
    calibratedEv: noise(p.calibratedEv),
    evRatio: noise(p.evRatio),
    totalPulls: p.totalPulls + tick * Math.floor(Math.random() * 4 + 1),
    remaining: Math.max(1, p.remaining - Math.floor(tick * Math.random() * 0.8)),
    trend: [...p.trend.slice(1), noise(p.evRatio)],
  }))
}

export const PACKS = BASE_PACKS

export const REAL_PULLS: PullRecord[] = [
  { id: '1', cardName: 'Houndoom Aquapolis', packName: 'Pokémon Pro', packPrice: 99, value: 1089, profit: 990, imageUrl: 'https://www.pulld.io/pulls/pull-9.png', userName: 'besticeman', rarity: 'legendary' },
  { id: '2', cardName: 'Dialga G Crosshatch', packName: 'Pokémon Pro', packPrice: 100, value: 160, profit: 60, imageUrl: 'https://www.pulld.io/pulls/pull-3.jpg', userName: 'cy_buyback', rarity: 'rare' },
  { id: '3', cardName: 'Pheromosa & Buzzwole GX', packName: 'Pokémon Pro', packPrice: 50, value: 113, profit: 63, imageUrl: 'https://www.pulld.io/pulls/pull-2.jpg', userName: 'goldsports', rarity: 'rare' },
  { id: '4', cardName: 'Mew Galarian Gallery', packName: 'Pokémon Starter', packPrice: 50, value: 110, profit: 60, imageUrl: 'https://www.pulld.io/pulls/pull-4.jpg', userName: 'karan_pulls', rarity: 'rare' },
  { id: '5', cardName: 'Zacian V Full Art', packName: 'Pokémon Starter', packPrice: 50, value: 86.20, profit: 36.20, imageUrl: 'https://www.pulld.io/pulls/pull-1.jpg', userName: 'celestialadv', rarity: 'rare' },
  { id: '6', cardName: 'Iron Valiant EX', packName: 'Pokémon Starter', packPrice: 25, value: 60.40, profit: 35.40, imageUrl: 'https://www.pulld.io/pulls/pull-6.png', userName: 'signedstrength', rarity: 'uncommon' },
  { id: '7', cardName: 'Magikarp Taruka', packName: 'Pokémon Starter', packPrice: 25, value: 53.30, profit: 28.30, imageUrl: 'https://www.pulld.io/pulls/pull-5.jpg', userName: 'loochuz', rarity: 'uncommon' },
  { id: '8', cardName: 'Dark Alakazam 1st Ed', packName: 'Pokémon Starter', packPrice: 25, value: 47.60, profit: 22.60, imageUrl: 'https://www.pulld.io/pulls/pull-8.png', userName: 'anon', rarity: 'uncommon' },
  { id: '9', cardName: 'Rhyhorn Reverse Foil', packName: 'Pokémon Starter', packPrice: 25, value: 39.46, profit: 14.46, imageUrl: 'https://www.pulld.io/pulls/pull-7.png', userName: 'ripsecret', rarity: 'common' },
  { id: '10', cardName: 'LeBron James Auto /99', packName: 'Basketball Pro', packPrice: 50, value: 340, profit: 290, imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&q=80', userName: 'signedstrength', rarity: 'legendary' },
]
