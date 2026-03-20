export interface Pack {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  evRatio: number;
  calibratedEv: number;
  buybackEv: number;
  winRate: number;
  avgFmv: number;
  bestPull: number;
  totalPulls: number;
  trend: "up" | "down" | "flat";
  lastUpdated: string;
}

export interface PullRecord {
  id: string;
  packName: string;
  cardName: string;
  user: string;
  fmv: number;
  packPrice: number;
  grader: string;
  grade: string;
  timestamp: string;
}

export const PACKS: Pack[] = [
  {
    id: "pkmn-master-pack",
    slug: "pokemon-master",
    name: "Pokémon Master Pack",
    category: "Pokémon",
    price: 100,
    evRatio: 1.103,
    calibratedEv: 110.3,
    buybackEv: 0.933,
    winRate: 0.60,
    avgFmv: 110.3,
    bestPull: 147.7,
    totalPulls: 5,
    trend: "up",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "football-master-pack",
    slug: "football-master",
    name: "Football Master Pack",
    category: "Football",
    price: 100,
    evRatio: 1.20,
    calibratedEv: 120.0,
    buybackEv: 1.015,
    winRate: 1.0,
    avgFmv: 120.0,
    bestPull: 120.0,
    totalPulls: 1,
    trend: "flat",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "pkmn-pro-pack",
    slug: "pokemon-pro",
    name: "Pokémon Pro Pack",
    category: "Pokémon",
    price: 50,
    evRatio: 0.871,
    calibratedEv: 43.55,
    buybackEv: 0.737,
    winRate: 0.313,
    avgFmv: 43.55,
    bestPull: 84.90,
    totalPulls: 16,
    trend: "down",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "pkmn-starter-pack",
    slug: "pokemon-starter",
    name: "Pokémon Starter Pack",
    category: "Pokémon",
    price: 25,
    evRatio: 0.977,
    calibratedEv: 24.43,
    buybackEv: 0.827,
    winRate: 0.313,
    avgFmv: 24.43,
    bestPull: 59.50,
    totalPulls: 16,
    trend: "down",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "football-pro-pack",
    slug: "football-pro",
    name: "Football Pro Pack",
    category: "Football",
    price: 50,
    evRatio: 0.907,
    calibratedEv: 45.33,
    buybackEv: 0.767,
    winRate: 0.50,
    avgFmv: 45.33,
    bestPull: 64.70,
    totalPulls: 4,
    trend: "flat",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "football-starter-pack",
    slug: "football-starter",
    name: "Football Starter Pack",
    category: "Football",
    price: 25,
    evRatio: 0.846,
    calibratedEv: 21.15,
    buybackEv: 0.716,
    winRate: 0.0,
    avgFmv: 21.15,
    bestPull: 21.60,
    totalPulls: 2,
    trend: "down",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "magic-booster-pack",
    slug: "magic-the-gathering",
    name: "Magic: The Gathering",
    category: "Magic",
    price: 10,
    evRatio: 0.76,
    calibratedEv: 7.60,
    buybackEv: 0.643,
    winRate: 0.0,
    avgFmv: 7.60,
    bestPull: 8.70,
    totalPulls: 2,
    trend: "down",
    lastUpdated: new Date().toISOString(),
  },
];

export const RECENT_PULLS: PullRecord[] = [
  {
    id: "pull-1",
    packName: "Pokémon Master Pack",
    cardName: "Tornadus Vmax - Full Art Secret",
    user: "emeraldhope1333",
    fmv: 147.70,
    packPrice: 100,
    grader: "PSA",
    grade: "10 GEM MINT",
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
  {
    id: "pull-2",
    packName: "Football Master Pack",
    cardName: "Patrick Mahomes RC Auto",
    user: "cardking99",
    fmv: 120.00,
    packPrice: 100,
    grader: "PSA",
    grade: "9 MINT",
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: "pull-3",
    packName: "Pokémon Pro Pack",
    cardName: "Rayquaza ex Full Art",
    user: "pokefan_22",
    fmv: 84.90,
    packPrice: 50,
    grader: "PSA",
    grade: "9 MINT",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "pull-4",
    packName: "Pokémon Starter Pack",
    cardName: "1999 Pokémon #10 Lapras - Holo",
    user: "emeraldhope1333",
    fmv: 37.50,
    packPrice: 25,
    grader: "PSA",
    grade: "7 NM",
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: "pull-5",
    packName: "Football Pro Pack",
    cardName: "Joe Burrow Prizm Silver",
    user: "sportscollector",
    fmv: 64.70,
    packPrice: 50,
    grader: "PSA",
    grade: "8 NM-MT",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: "pull-6",
    packName: "Pokémon Starter Pack",
    cardName: "Charizard Base Set",
    user: "trainer_red",
    fmv: 59.50,
    packPrice: 25,
    grader: "PSA",
    grade: "6 EX-MT",
    timestamp: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
  },
  {
    id: "pull-7",
    packName: "Magic: The Gathering",
    cardName: "Black Lotus Reprint",
    user: "mtgwizard",
    fmv: 8.70,
    packPrice: 10,
    grader: "BGS",
    grade: "8 NM-MT",
    timestamp: new Date(Date.now() - 1000 * 60 * 41).toISOString(),
  },
  {
    id: "pull-8",
    packName: "Pokémon Pro Pack",
    cardName: "Pikachu VMAX Rainbow Rare",
    user: "pokecollector",
    fmv: 43.55,
    packPrice: 50,
    grader: "PSA",
    grade: "9 MINT",
    timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
  },
];

export function getPacks(): Pack[] {
  return PACKS;
}

export function getRecentPulls(): PullRecord[] {
  return RECENT_PULLS;
}
