import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

export interface Pack {
  id: string
  name: string
  category: string
  price: number
  calibratedEv: number
  evRatio: number
  buybackEv: number
  buybackRatio: number
  winRate: number
  totalPulls: number
  remaining: number
  totalSlots: number
  signal: 'GREAT VALUE' | 'GOOD VALUE' | 'FAIR VALUE' | 'BELOW EV'
  trend: number[]
  topCard: string
  topCardValue: number
  lastUpdated: string
}

export interface LivePull {
  id: string
  packName: string
  cardName: string
  value: number
  packPrice: number
  profit: number
  imageUrl: string
  userName: string
  rarity: 'legendary' | 'rare' | 'uncommon' | 'common'
  timestamp: string
}

// Courtyard-accurate pack data (mirrors real pack structure from pulld.io/evault)
const PACKS: Pack[] = [
  {
    id: 'basketball-pro',
    name: 'Basketball Pro Pack',
    category: 'Basketball',
    price: 50,
    calibratedEv: 83.72,
    evRatio: 1.674,
    buybackEv: 67.20,
    buybackRatio: 1.344,
    winRate: 68.5,
    totalPulls: 2145,
    remaining: 312,
    totalSlots: 500,
    signal: 'GREAT VALUE',
    trend: [1.44, 1.51, 1.58, 1.61, 1.64, 1.67, 1.674],
    topCard: 'LeBron James Auto',
    topCardValue: 850,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'basketball-master',
    name: 'Basketball Master Pack',
    category: 'Basketball',
    price: 100,
    calibratedEv: 146.91,
    evRatio: 1.469,
    buybackEv: 112.40,
    buybackRatio: 1.124,
    winRate: 55.2,
    totalPulls: 984,
    remaining: 88,
    totalSlots: 200,
    signal: 'GREAT VALUE',
    trend: [1.38, 1.40, 1.43, 1.45, 1.46, 1.47, 1.469],
    topCard: 'Michael Jordan PSA 10',
    topCardValue: 2400,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pokemon-pro',
    name: 'Pokémon Pro Pack',
    category: 'Pokémon',
    price: 50,
    calibratedEv: 65.45,
    evRatio: 1.309,
    buybackEv: 52.10,
    buybackRatio: 1.042,
    winRate: 44.8,
    totalPulls: 1540,
    remaining: 220,
    totalSlots: 400,
    signal: 'GREAT VALUE',
    trend: [1.22, 1.24, 1.27, 1.29, 1.30, 1.31, 1.309],
    topCard: 'Charizard Holo 1st Ed',
    topCardValue: 1200,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'football-pro',
    name: 'Football Pro Pack',
    category: 'Football',
    price: 50,
    calibratedEv: 65.30,
    evRatio: 1.306,
    buybackEv: 51.80,
    buybackRatio: 1.036,
    winRate: 42.1,
    totalPulls: 551,
    remaining: 178,
    totalSlots: 300,
    signal: 'GREAT VALUE',
    trend: [1.18, 1.22, 1.25, 1.28, 1.30, 1.30, 1.306],
    topCard: 'Patrick Mahomes Auto',
    topCardValue: 780,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pokemon-starter',
    name: 'Pokémon Starter Pack',
    category: 'Pokémon',
    price: 25,
    calibratedEv: 30.62,
    evRatio: 1.225,
    buybackEv: 24.50,
    buybackRatio: 0.980,
    winRate: 38.4,
    totalPulls: 4277,
    remaining: 623,
    totalSlots: 1000,
    signal: 'GOOD VALUE',
    trend: [1.14, 1.16, 1.18, 1.20, 1.21, 1.22, 1.225],
    topCard: 'Mew V Alt Art',
    topCardValue: 290,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pokemon-master',
    name: 'Pokémon Master Pack',
    category: 'Pokémon',
    price: 100,
    calibratedEv: 117.15,
    evRatio: 1.172,
    buybackEv: 89.20,
    buybackRatio: 0.892,
    winRate: 35.0,
    totalPulls: 984,
    remaining: 141,
    totalSlots: 300,
    signal: 'GOOD VALUE',
    trend: [1.09, 1.11, 1.13, 1.15, 1.16, 1.17, 1.172],
    topCard: 'Dialga G Crosshatch',
    topCardValue: 1800,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'sports-platinum',
    name: 'Sports Platinum Pack',
    category: 'Sports',
    price: 500,
    calibratedEv: 569.05,
    evRatio: 1.138,
    buybackEv: 442.50,
    buybackRatio: 0.885,
    winRate: 28.2,
    totalPulls: 74,
    remaining: 22,
    totalSlots: 50,
    signal: 'GOOD VALUE',
    trend: [1.06, 1.08, 1.09, 1.10, 1.11, 1.13, 1.138],
    topCard: 'Tom Brady 1/1 Auto',
    topCardValue: 12000,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'baseball-starter',
    name: 'Baseball Starter Pack',
    category: 'Baseball',
    price: 25,
    calibratedEv: 24.50,
    evRatio: 0.980,
    buybackEv: 19.60,
    buybackRatio: 0.784,
    winRate: 28.8,
    totalPulls: 3210,
    remaining: 890,
    totalSlots: 1200,
    signal: 'FAIR VALUE',
    trend: [1.02, 1.01, 1.00, 0.99, 0.98, 0.98, 0.980],
    topCard: 'Shohei Ohtani RC Auto',
    topCardValue: 420,
    lastUpdated: new Date().toISOString(),
  },
]

const LIVE_PULLS: LivePull[] = [
  { id: '1', packName: 'Basketball Pro', cardName: 'LeBron James Auto /99', value: 340, packPrice: 50, profit: 290, imageUrl: '', userName: 'karan_pulls', rarity: 'legendary', timestamp: new Date().toISOString() },
  { id: '2', packName: 'Pokémon Pro', cardName: 'Charizard Holo 1st Ed', value: 1089, packPrice: 50, profit: 1039, imageUrl: '', userName: 'besticeman', rarity: 'legendary', timestamp: new Date().toISOString() },
  { id: '3', packName: 'Football Pro', cardName: 'Mahomes RPA /25', value: 780, packPrice: 50, profit: 730, imageUrl: '', userName: 'cy_buyback', rarity: 'legendary', timestamp: new Date().toISOString() },
  { id: '4', packName: 'Basketball Master', cardName: 'Jordan PSA 9', value: 320, packPrice: 100, profit: 220, imageUrl: '', userName: 'signedstrength', rarity: 'rare', timestamp: new Date().toISOString() },
  { id: '5', packName: 'Pokémon Starter', cardName: 'Dialga G Crosshatch', value: 160, packPrice: 25, profit: 135, imageUrl: '', userName: 'goldsports', rarity: 'rare', timestamp: new Date().toISOString() },
  { id: '6', packName: 'Pokémon Pro', cardName: 'Pheromosa Buzzwole GX', value: 113, packPrice: 50, profit: 63, imageUrl: '', userName: 'celestialadv', rarity: 'rare', timestamp: new Date().toISOString() },
  { id: '7', packName: 'Baseball Starter', cardName: 'Trout Auto /150', value: 48, packPrice: 25, profit: 23, imageUrl: '', userName: 'loochuz', rarity: 'uncommon', timestamp: new Date().toISOString() },
  { id: '8', packName: 'Football Pro', cardName: 'Burrow Base RC', value: 38, packPrice: 50, profit: -12, imageUrl: '', userName: 'anon', rarity: 'common', timestamp: new Date().toISOString() },
]

function addNoise(base: number, pct = 0.02): number {
  return base * (1 + (Math.random() - 0.5) * pct)
}

export function useCourtyardData() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 8000)
    return () => clearInterval(id)
  }, [])

  const { data: packs, isLoading } = useQuery({
    queryKey: ['packs', tick],
    queryFn: async () => {
      // Simulate live EV fluctuation — in production this hits Courtyard API via edge function
      return PACKS.map(p => ({
        ...p,
        calibratedEv: addNoise(p.calibratedEv),
        evRatio: addNoise(p.evRatio),
        totalPulls: p.totalPulls + Math.floor(Math.random() * 3),
        remaining: Math.max(1, p.remaining - Math.floor(Math.random() * 2)),
      }))
    },
    initialData: PACKS,
    staleTime: 7000,
  })

  const { data: livePulls } = useQuery({
    queryKey: ['livePulls', tick],
    queryFn: async () => {
      // Rotate and randomize the live feed
      const rotated = [...LIVE_PULLS]
      if (tick % 2 === 0) {
        const last = rotated.pop()!
        rotated.unshift({ ...last, id: String(Date.now()), timestamp: new Date().toISOString() })
      }
      return rotated
    },
    initialData: LIVE_PULLS,
    staleTime: 7000,
  })

  return { packs: packs || PACKS, livePulls: livePulls || LIVE_PULLS, isLoading }
}
