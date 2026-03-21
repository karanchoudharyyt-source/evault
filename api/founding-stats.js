// api/founding-stats.js
// Returns founding member counts — shown in upgrade modal

const SUPABASE_URL      = 'https://mhsbszeeepiqfypyejys.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oc2JzemVlZXBpcWZ5cHllanlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDAzNjYsImV4cCI6MjA4OTMxNjM2Nn0.pBaT3-76zgpREXUIiFso6HyHRdjhcQ1joT9TqLJkaJo';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30');

  const r = await fetch(`${SUPABASE_URL}/rest/v1/founding_stats`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  const data = await r.json();
  const stats = data?.[0] ?? { founding_count: 0, founding_remaining: 25, total_paid: 0 };

  const foundingLeft = Number(stats.founding_remaining);
  const isFounding   = foundingLeft > 0;

  return res.status(200).json({
    foundingCount:     Number(stats.founding_count),
    foundingRemaining: foundingLeft,
    foundingTotal:     25,
    totalPaid:         Number(stats.total_paid),
    currentTier:       isFounding ? 'founding' : 'standard',
    currentPrice:      isFounding ? 19 : 29,
    nextPrice:         isFounding ? 29 : 29,
  });
}
