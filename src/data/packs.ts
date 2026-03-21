// ─── Types ────────────────────────────────────────────────────────────────────
export interface Pack {
  id: string;
  slug?: string;
  name: string;
  category: string;
  categoryTitle?: string;
  categoryColor?: string;
  categoryOrder?: number;
  price: number;
  evRatio: number;
  calibratedEv?: number;
  calEv?: number;
  buybackEv: number;
  winRate: number;
  avgFmv?: number;
  bestPull?: number;
  totalPulls?: number;
  pullCount?: number;
  trend: "up" | "down" | "flat";
  lastUpdated?: string;
  hasData?: boolean;
}

export interface PullRecord {
  id: string;
  packName: string;
  packId?: string;
  cardName?: string;
  user?: string;
  buyer?: string;
  fmv: number;
  delta?: number;
  packPrice?: number;
  grader?: string;
  grade?: string;
  image?: string;
  title?: string;
  txTime?: string;
  timestamp?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BB = 0.9 * 0.94; // buyback after 10% offer cut + 6% processing fee

interface PackConfig {
  name: string;
  slug: string;
  price: number;
  category: string;
}

export const PACK_CONFIG: Record<string, PackConfig> = {
  "pkmn-basic-pack":         { name: "Pokémon Basic",        slug: "pokemon-basic",    price: 10,  category: "Pokémon"    },
  "pkmn-starter-pack":       { name: "Pokémon Starter",      slug: "pokemon-starter",  price: 25,  category: "Pokémon"    },
  "pkmn-pro-pack":           { name: "Pokémon Pro",          slug: "pokemon-pro",      price: 50,  category: "Pokémon"    },
  "pkmn-master-pack":        { name: "Pokémon Master",       slug: "pokemon-master",   price: 100, category: "Pokémon"    },
  "pkmn-diamond-pack":       { name: "Pokémon Diamond",      slug: "pokemon-diamond",  price: 500, category: "Pokémon"    },
  "baseball-starter-pack":   { name: "Baseball Starter",     slug: "baseball-starter", price: 25,  category: "Baseball"   },
  "baseball-pro-pack":       { name: "Baseball Pro",         slug: "baseball-pro",     price: 50,  category: "Baseball"   },
  "baseball-master-pack":    { name: "Baseball Master",      slug: "baseball-master",  price: 100, category: "Baseball"   },
  "basketball-starter-pack": { name: "Basketball Starter",   slug: "bball-starter",    price: 25,  category: "Basketball" },
  "basketball-pro-pack":     { name: "Basketball Pro",       slug: "bball-pro",        price: 50,  category: "Basketball" },
  "basketball-master-pack":  { name: "Basketball Master",    slug: "bball-master",     price: 100, category: "Basketball" },
  "hockey-starter-pack":     { name: "Hockey Starter",       slug: "hockey-starter",   price: 25,  category: "Hockey"     },
  "hockey-pro-pack":         { name: "Hockey Pro",           slug: "hockey-pro",       price: 50,  category: "Hockey"     },
  "hockey-master-pack":      { name: "Hockey Master",        slug: "hockey-master",    price: 100, category: "Hockey"     },
  "football-starter-pack":   { name: "Football Starter",     slug: "football-starter", price: 25,  category: "Football"   },
  "football-pro-pack":       { name: "Football Pro",         slug: "football-pro",     price: 50,  category: "Football"   },
  "football-master-pack":    { name: "Football Master",      slug: "football-master",  price: 100, category: "Football"   },
  "soccer-starter-pack":     { name: "Soccer Starter",       slug: "soccer-starter",   price: 25,  category: "Soccer"     },
  "soccer-pro-pack":         { name: "Soccer Pro",           slug: "soccer-pro",       price: 50,  category: "Soccer"     },
  "sports-legend-pack":      { name: "Sports Legend",        slug: "sports-legend",    price: 100, category: "Sports"     },
  "magic-booster-pack":      { name: "Magic: The Gathering", slug: "magic-gathering",  price: 10,  category: "Magic"      },
  "cgc-comics-pack":         { name: "CGC Comics",           slug: "cgc-comics",       price: 200, category: "Comics"     },
  "premier-watch-box":       { name: "Premier Watch Box",    slug: "watch-box",        price: 500, category: "Watch"      },
};

const EMAP: Record<string, string> = {
  "Pokémon Basic Pack": "pkmn-basic-pack", "Pokémon Basic": "pkmn-basic-pack",
  "Pokémon Starter Pack": "pkmn-starter-pack", "Pokémon Starter": "pkmn-starter-pack",
  "Pokémon Pro Pack": "pkmn-pro-pack", "Pokémon Pro": "pkmn-pro-pack",
  "Pokémon Master Pack": "pkmn-master-pack", "Pokémon Master": "pkmn-master-pack",
  "Pokémon Diamond Pack": "pkmn-diamond-pack", "Pokémon Diamond": "pkmn-diamond-pack",
  "Baseball Starter Pack": "baseball-starter-pack", "Baseball Starter": "baseball-starter-pack",
  "Baseball Pro Pack": "baseball-pro-pack", "Baseball Pro": "baseball-pro-pack",
  "Baseball Master Pack": "baseball-master-pack", "Baseball Master": "baseball-master-pack",
  "Basketball Starter Pack": "basketball-starter-pack", "Basketball Starter": "basketball-starter-pack",
  "Basketball Pro Pack": "basketball-pro-pack", "Basketball Pro": "basketball-pro-pack",
  "Basketball Master Pack": "basketball-master-pack", "Basketball Master": "basketball-master-pack",
  "Hockey Starter Pack": "hockey-starter-pack", "Hockey Starter": "hockey-starter-pack",
  "Hockey Pro Pack": "hockey-pro-pack", "Hockey Pro": "hockey-pro-pack",
  "Hockey Master Pack": "hockey-master-pack", "Hockey Master": "hockey-master-pack",
  "Football Starter Pack": "football-starter-pack", "Football Starter": "football-starter-pack",
  "Football Pro Pack": "football-pro-pack", "Football Pro": "football-pro-pack",
  "Football Master Pack": "football-master-pack", "Football Master": "football-master-pack",
  "Soccer Starter Pack": "soccer-starter-pack", "Soccer Starter": "soccer-starter-pack",
  "Soccer Pro Pack": "soccer-pro-pack", "Soccer Pro": "soccer-pro-pack",
  "Sports Legend Pack": "sports-legend-pack", "Sports Legend": "sports-legend-pack",
  "Sealed Magic: The Gathering Booster": "magic-booster-pack", "Magic: The Gathering": "magic-booster-pack",
  "CGC Comics": "cgc-comics-pack",
  "Premier Watch Box": "premier-watch-box",
};

function getPackId(asset: any): string | null {
  const ev = asset.attributes?.find((x: any) => x.name === "Event")?.value ?? "";
  if (EMAP[ev]) return EMAP[ev];
  const lo = ev.toLowerCase();
  for (const [k, v] of Object.entries(EMAP)) {
    if (lo.includes(k.toLowerCase())) return v;
  }
  return null;
}

function attr(asset: any, name: string): string {
  return asset.attributes?.find((x: any) => x.name === name)?.value ?? "";
}

// ─── Build Pack[] from live API assets ────────────────────────────────────────
export function buildPacksFromAssets(assets: any[]): Pack[] {
  const grouped: Record<string, { fmvs: number[]; raws: any[] }> = {};

  for (const asset of assets) {
    const id = getPackId(asset);
    if (!id || !PACK_CONFIG[id]) continue;
    const fmv = asset.fmv_estimate_usd ?? 0;
    if (!fmv) continue;
    if (!grouped[id]) grouped[id] = { fmvs: [], raws: [] };
    grouped[id].fmvs.push(fmv);
    grouped[id].raws.push(asset);
  }

  return Object.entries(grouped).map(([id, { fmvs }]) => {
    const cfg = PACK_CONFIG[id];
    const n = fmvs.length;
    const avg = fmvs.reduce((a, b) => a + b, 0) / n;
    const bb = avg * BB;

    // Simple trend: compare most recent pulls vs earlier ones
    let trend: "up" | "down" | "flat" = "flat";
    if (n >= 4) {
      const mid = Math.floor(n / 2);
      const early = fmvs.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
      const recent = fmvs.slice(mid).reduce((a, b) => a + b, 0) / (n - mid);
      if (recent > early * 1.03) trend = "up";
      else if (recent < early * 0.97) trend = "down";
    }

    return {
      id,
      slug: cfg.slug,
      name: cfg.name,
      category: cfg.category,
      price: cfg.price,
      evRatio: avg / cfg.price,
      calibratedEv: avg,
      buybackEv: bb / cfg.price,
      winRate: fmvs.filter(v => v > cfg.price).length / n,
      avgFmv: avg,
      bestPull: Math.max(...fmvs),
      totalPulls: n,
      trend,
      lastUpdated: new Date().toISOString(),
    };
  }).sort((a, b) => b.evRatio - a.evRatio);
}

// ─── Build PullRecord[] from live API assets ──────────────────────────────────
export function buildFeedFromAssets(assets: any[]): PullRecord[] {
  return assets
    .slice(0, 60)
    .map((asset, i) => {
      const id = getPackId(asset);
      const cfg = id ? PACK_CONFIG[id] : null;
      if (!cfg) return null;
      return {
        id: asset.token_id ?? `pull-${i}`,
        packName: cfg.name,
        cardName: attr(asset, "Title/Subject") || "—",
        user: asset.owner?.username ?? "anon",
        fmv: asset.fmv_estimate_usd ?? 0,
        packPrice: cfg.price,
        grader: attr(asset, "Grader"),
        grade: attr(asset, "Grade"),
        timestamp: asset.tx_time ?? new Date().toISOString(),
      };
    })
    .filter(Boolean) as PullRecord[];
}

// ─── Fallback data (used when API is unreachable) ────────────────────────────
export const PACKS: Pack[] = [
  { id: "pkmn-master-pack", slug: "pokemon-master", name: "Pokémon Master", category: "Pokémon", price: 100, evRatio: 1.103, calibratedEv: 110.3, buybackEv: 0.933, winRate: 0.6, avgFmv: 110.3, bestPull: 147.7, totalPulls: 5, trend: "up", lastUpdated: new Date().toISOString() },
  { id: "football-master-pack", slug: "football-master", name: "Football Master", category: "Football", price: 100, evRatio: 1.20, calibratedEv: 120.0, buybackEv: 1.015, winRate: 1.0, avgFmv: 120.0, bestPull: 120.0, totalPulls: 1, trend: "flat", lastUpdated: new Date().toISOString() },
  { id: "pkmn-pro-pack", slug: "pokemon-pro", name: "Pokémon Pro", category: "Pokémon", price: 50, evRatio: 0.871, calibratedEv: 43.55, buybackEv: 0.737, winRate: 0.313, avgFmv: 43.55, bestPull: 84.9, totalPulls: 16, trend: "down", lastUpdated: new Date().toISOString() },
  { id: "pkmn-starter-pack", slug: "pokemon-starter", name: "Pokémon Starter", category: "Pokémon", price: 25, evRatio: 0.977, calibratedEv: 24.43, buybackEv: 0.827, winRate: 0.313, avgFmv: 24.43, bestPull: 59.5, totalPulls: 16, trend: "down", lastUpdated: new Date().toISOString() },
];

export const RECENT_PULLS: PullRecord[] = [
  { id: "fp-1", packName: "Pokémon Master", cardName: "Tornadus Vmax Full Art", user: "emeraldhope1333", fmv: 147.7, packPrice: 100, grader: "PSA", grade: "10", timestamp: new Date(Date.now() - 120000).toISOString() },
  { id: "fp-2", packName: "Football Master", cardName: "Patrick Mahomes RC Auto", user: "cardking99", fmv: 120.0, packPrice: 100, grader: "PSA", grade: "9", timestamp: new Date(Date.now() - 480000).toISOString() },
];

export function getPacks() { return PACKS; }
export function getRecentPulls() { return RECENT_PULLS; }
