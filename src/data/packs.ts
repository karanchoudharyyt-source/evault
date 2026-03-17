export interface PackData {
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
  rarity: string
}

export const PACKS: PackData[] = [
  { id: 'bball-pro', name: 'Basketball Pro Pack', category: 'Basketball', price: 50, calibratedEv: 83.72, evRatio: 1.674, buybackEv: 67.20, buybackRatio: 1.344, winRate: 68.5, totalPulls: 2145, remaining: 312, totalSlots: 500, signal: 'GREAT VALUE', trend: [1.44,1.51,1.58,1.61,1.64,1.67,1.674] },
  { id: 'bball-master', name: 'Basketball Master Pack', category: 'Basketball', price: 100, calibratedEv: 146.91, evRatio: 1.469, buybackEv: 112.40, buybackRatio: 1.124, winRate: 55.2, totalPulls: 984, remaining: 88, totalSlots: 200, signal: 'GREAT VALUE', trend: [1.38,1.40,1.43,1.45,1.46,1.47,1.469] },
  { id: 'poke-pro', name: 'Pokémon Pro Pack', category: 'Pokémon', price: 50, calibratedEv: 65.45, evRatio: 1.309, buybackEv: 52.10, buybackRatio: 1.042, winRate: 44.8, totalPulls: 1540, remaining: 220, totalSlots: 400, signal: 'GREAT VALUE', trend: [1.22,1.24,1.27,1.29,1.30,1.31,1.309] },
  { id: 'foot-pro', name: 'Football Pro Pack', category: 'Football', price: 50, calibratedEv: 65.30, evRatio: 1.306, buybackEv: 51.80, buybackRatio: 1.036, winRate: 42.1, totalPulls: 551, remaining: 178, totalSlots: 300, signal: 'GREAT VALUE', trend: [1.18,1.22,1.25,1.28,1.30,1.30,1.306] },
  { id: 'poke-starter', name: 'Pokémon Starter Pack', category: 'Pokémon', price: 25, calibratedEv: 30.62, evRatio: 1.225, buybackEv: 24.50, buybackRatio: 0.980, winRate: 38.4, totalPulls: 4277, remaining: 623, totalSlots: 1000, signal: 'GOOD VALUE', trend: [1.14,1.16,1.18,1.20,1.21,1.22,1.225] },
  { id: 'poke-master', name: 'Pokémon Master Pack', category: 'Pokémon', price: 100, calibratedEv: 117.15, evRatio: 1.172, buybackEv: 89.20, buybackRatio: 0.892, winRate: 35.0, totalPulls: 984, remaining: 141, totalSlots: 300, signal: 'GOOD VALUE', trend: [1.09,1.11,1.13,1.15,1.16,1.17,1.172] },
  { id: 'sports-plat', name: 'Sports Platinum Pack', category: 'Sports', price: 500, calibratedEv: 569.05, evRatio: 1.138, buybackEv: 442.50, buybackRatio: 0.885, winRate: 28.2, totalPulls: 74, remaining: 22, totalSlots: 50, signal: 'GOOD VALUE', trend: [1.06,1.08,1.09,1.10,1.11,1.13,1.138] },
  { id: 'base-starter', name: 'Baseball Starter Pack', category: 'Baseball', price: 25, calibratedEv: 24.50, evRatio: 0.980, buybackEv: 19.60, buybackRatio: 0.784, winRate: 28.8, totalPulls: 3210, remaining: 890, totalSlots: 1200, signal: 'FAIR VALUE', trend: [1.02,1.01,1.00,0.99,0.98,0.98,0.980] },
]

export const RECENT_PULLS: PullRecord[] = [
  { id:'1', cardName:'LeBron James Auto /99', packName:'Basketball Pro', packPrice:50, value:340, profit:290, imageUrl:'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&q=80', userName:'karan_pulls', rarity:'grail' },
  { id:'2', cardName:'Charizard Holo 1st Ed', packName:'Pokémon Pro', packPrice:50, value:1089, profit:1039, imageUrl:'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=200&q=80', userName:'besticeman', rarity:'grail' },
  { id:'3', cardName:'Mahomes RPA /25', packName:'Football Pro', packPrice:50, value:780, profit:730, imageUrl:'https://images.unsplash.com/photo-1604284705462-83b14fd7c001?w=200&q=80', userName:'cy_buyback', rarity:'grail' },
  { id:'4', cardName:'Jordan PSA 9 Mosaic', packName:'Basketball Master', packPrice:100, value:320, profit:220, imageUrl:'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=200&q=80', userName:'signedstrength', rarity:'holo' },
  { id:'5', cardName:'Dialga G Crosshatch', packName:'Pokémon Pro', packPrice:50, value:160, profit:110, imageUrl:'https://images.unsplash.com/photo-1599153066269-50a50f80d5c4?w=200&q=80', userName:'goldsports', rarity:'holo' },
  { id:'6', cardName:'Mew V Alt Art', packName:'Pokémon Starter', packPrice:25, value:113, profit:88, imageUrl:'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=200&q=80', userName:'celestialadv', rarity:'holo' },
  { id:'7', cardName:'Trout Auto /150', packName:'Baseball Starter', packPrice:25, value:48, profit:23, imageUrl:'https://images.unsplash.com/photo-1508344928928-7165b67de128?w=200&q=80', userName:'loochuz', rarity:'rare' },
  { id:'8', cardName:'Burrow Base RC', packName:'Football Pro', packPrice:50, value:38, profit:-12, imageUrl:'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=200&q=80', userName:'anon', rarity:'common' },
]
