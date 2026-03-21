// api/landing-pulls.js
// Fetches real recent pulls from Courtyard for the landing page
// Returns card images, names, FMV, pack info

const H = {
  'User-Agent': 'Mozilla/5.0',
  'Accept': 'application/json',
  'Origin': 'https://courtyard.io',
  'Referer': 'https://courtyard.io/',
};

function slugFromAsset(a) {
  const img = a.reveal_state?.sealed_pack_image ?? '';
  const m = img.match(/vending-machine\/([^\/]+)\/resources/);
  return m?.[1] ?? null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120');

  try {
    const r = await fetch(
      'https://api.courtyard.io/index/query/recent-pulls?limit=200',
      { headers: H }
    );
    const j = await r.json();
    const assets = j.assets ?? [];

    // Filter for pulls with real card images and good FMV
    const pulls = assets
      .filter(a => a.cropped_image && a.fmv_estimate_usd > 20)
      .slice(0, 10)
      .map(a => ({
        id:       a.collectible_id,
        title:    a.title ?? '',
        image:    a.cropped_image ?? a.image ?? '',
        fmv:      a.fmv_estimate_usd ?? 0,
        packSlug: slugFromAsset(a) ?? '',
        grade:    a.attributes?.find(x => x.name === 'Grade')?.value ?? '',
        category: a.attributes?.find(x => x.name === 'Category')?.value ?? '',
        txTime:   a.tx_time ?? '',
        owner:    a.owner?.username ?? 'anon',
      }));

    return res.status(200).json({ pulls });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
