// api/pulls.js
// Fetches live Courtyard data and returns enriched pack EV for all active vending machines
// Uses /vending-machines to auto-discover all packs — no hardcoded list

function priceFromId(id) {
  if(id.includes('basic'))     return 10;
  if(id.includes('starter'))   return 25;
  if(id.includes('pro'))       return 50;
  if(id.includes('ultra'))     return 75;
  if(id.includes('master'))    return 100;
  if(id.includes('platinum'))  return 200;
  if(id.includes('diamond'))   return 500;
  if(id.includes('legend'))    return 500;
  if(id.includes('comic-pro')) return 100;
  if(id.includes('bronze'))    return 50;
  if(id.includes('silver'))    return 100;
  if(id.includes('modern'))    return 50;
  if(id.includes('lucky'))     return 50;
  if(id.includes('premier'))   return 500;
  return 50;
}

function slugFromAsset(a) {
  const img = a.reveal_state?.sealed_pack_image ?? '';
  const m = img.match(/vending-machine\/([^\/]+)\/resources/);
  return m?.[1] ?? null;
}

const CATEGORY_COLORS = {
  pkmn: '#2E47A5', baseball: '#296AA0', basketball: '#F4BA02',
  football: '#CF2B1F', hockey: '#5AB9EA', soccer: '#06E387',
  sports: '#0BB5CB', magic_the_gathering: '#8B5CF6', comics: '#F6FFD5',
  onepiece: '#E2D295', wildcard: '#FFCB05', watches: '#FFCB05',
  limited_drop: '#FF6B35',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const H = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Origin': 'https://courtyard.io',
    'Referer': 'https://courtyard.io/',
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    // Fetch both in parallel
    const [vmRes, pullsRes] = await Promise.all([
      fetch('https://api.courtyard.io/vending-machines', { signal: controller.signal, headers: H }),
      fetch('https://api.courtyard.io/index/query/recent-pulls?limit=500', { signal: controller.signal, headers: H }),
    ]);

    const [vmData, pullsData] = await Promise.all([vmRes.json(), pullsRes.json()]);

    // Build pack config from vending machines
    const packConfig = {};
    const packMeta = {};
    for (const vm of vmData.vendingMachines ?? []) {
      packConfig[vm.id] = { name: vm.title, price: priceFromId(vm.id) };
      packMeta[vm.id] = {
        category: vm.category?.id ?? 'sports',
        categoryTitle: vm.category?.title ?? vm.id,
        categoryColor: CATEGORY_COLORS[vm.category?.id] ?? '#888',
        categoryOrder: vm.category?.displayOrder ?? 99,
      };
    }

    const assets = pullsData.assets ?? [];

    // Decay-weighted EV per pack
    const packData = {};
    const now = Date.now();
    for (const a of assets) {
      const slug = slugFromAsset(a);
      if (!slug || !packConfig[slug]) continue;
      const fmv = Number(a.fmv_estimate_usd ?? 0);
      if (!fmv) continue;
      const w = Math.exp(-0.1 * (now - new Date(a.tx_time ?? now).getTime()) / 3_600_000);
      if (!packData[slug]) packData[slug] = { fmvs: [], weights: [], pulls: 0 };
      packData[slug].fmvs.push(fmv);
      packData[slug].weights.push(w);
      packData[slug].pulls++;
    }

    const BB = 0.9 * 0.94;

    // Build enriched packs array
    const packs = Object.entries(packConfig).map(([id, cfg]) => {
      const d = packData[id];
      const meta = packMeta[id];

      let evRatio = 0, buybackEv = 0, calEv = 0, winRate = 0;
      if (d && d.fmvs.length > 0) {
        const tw = d.weights.reduce((a, b) => a + b, 0);
        const avg = d.fmvs.reduce((a, f, i) => a + f * d.weights[i], 0) / tw;
        evRatio   = avg / cfg.price;
        buybackEv = (avg * BB) / cfg.price;
        calEv     = avg;
        winRate   = d.fmvs.filter(f => f >= cfg.price).length / d.fmvs.length;
      }

      // Trend: compare first half vs second half of pulls
      let trend = 'flat';
      if (d && d.fmvs.length >= 4) {
        const mid = Math.floor(d.fmvs.length / 2);
        const first = d.fmvs.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
        const last  = d.fmvs.slice(mid).reduce((a, b) => a + b, 0) / (d.fmvs.length - mid);
        if (last > first * 1.05) trend = 'up';
        else if (last < first * 0.95) trend = 'down';
      }

      return {
        id,
        name: cfg.name,
        price: cfg.price,
        category: meta.category,
        categoryTitle: meta.categoryTitle,
        categoryColor: meta.categoryColor,
        categoryOrder: meta.categoryOrder,
        evRatio:   Math.round(evRatio   * 10000) / 10000,
        buybackEv: Math.round(buybackEv * 10000) / 10000,
        calEv:     Math.round(calEv     * 100)   / 100,
        winRate:   Math.round(winRate   * 1000)  / 1000,
        pullCount: d?.pulls ?? 0,
        trend,
        // no data = skip in UI
        hasData: (d?.fmvs.length ?? 0) >= 1,
      };
    }).filter(p => p.hasData); // only show packs with actual data

    // Sort by categoryOrder then by evRatio desc
    packs.sort((a, b) => b.evRatio - a.evRatio);

    // Recent pulls for ticker/feed
    const recentPulls = assets.slice(0, 50).map(a => ({
      id:       a.collectible_id,
      title:    a.title,
      fmv:      a.fmv_estimate_usd,
      image:    a.cropped_image ?? a.image,
      buyer:    a.owner?.username ?? 'anon',
      packSlug: slugFromAsset(a),
      txTime:   a.tx_time,
      grade:    a.attributes?.find(x => x.name === 'Grade')?.value ?? '',
    }));

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=10');
    return res.status(200).json({ packs, recentPulls, totalPacks: packs.length });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    clearTimeout(timeout);
  }
}
