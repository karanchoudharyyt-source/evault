// api/ev-history.js
// Returns last N hours of EV snapshots for one or all packs
// GET /api/ev-history?packId=pkmn-pro-pack&hours=24
// GET /api/ev-history?hours=2  (all packs, last 2h)

const SUPABASE_URL = 'https://mhsbszeeepiqfypyejys.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oc2JzemVlZXBpcWZ5cHllanlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDAzNjYsImV4cCI6MjA4OTMxNjM2Nn0.pBaT3-76zgpREXUIiFso6HyHRdjhcQ1joT9TqLJkaJo';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const packId = req.query.packId;
  const hours  = Math.min(parseInt(req.query.hours || '24', 10), 168); // max 7 days

  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();

  let url = `${SUPABASE_URL}/rest/v1/ev_history?recorded_at=gte.${since}&order=recorded_at.asc&select=pack_id,ev_ratio,buyback_ev,recorded_at`;
  if (packId) url += `&pack_id=eq.${encodeURIComponent(packId)}`;

  // Limit rows to keep response fast (max 500 per pack)
  url += '&limit=2000';

  const r = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  });

  if (!r.ok) {
    return res.status(500).json({ error: await r.text() });
  }

  const rows = await r.json();

  // Group by pack_id — { packId: [{t, ev, buyback}] }
  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.pack_id]) grouped[row.pack_id] = [];
    grouped[row.pack_id].push({
      t:       row.recorded_at,
      ev:      parseFloat(row.ev_ratio),
      buyback: parseFloat(row.buyback_ev),
    });
  }

  return res.status(200).json({ data: grouped, count: rows.length });
}
