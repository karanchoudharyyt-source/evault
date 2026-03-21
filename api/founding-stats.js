// api/founding-stats.js
const SUPABASE_URL      = 'https://mhsbszeeepiqfypyejys.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oc2JzemVlZXBpcWZ5cHllanlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDAzNjYsImV4cCI6MjA4OTMxNjM2Nn0.pBaT3-76zgpREXUIiFso6HyHRdjhcQ1joT9TqLJkaJo';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30');

  const r     = await fetch(`${SUPABASE_URL}/rest/v1/founding_stats`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
  });
  const data  = await r.json();
  const stats = data?.[0] ?? { founding_count: 0, founding_remaining: 100, total_paid: 0 };

  const earlyLeft  = Number(stats.founding_remaining);  // spots left at $29
  const totalPaid  = Number(stats.total_paid);
  const isEarly    = earlyLeft > 0;
  const isGrowth   = !isEarly && totalPaid < 200;

  return res.status(200).json({
    foundingCount:     Number(stats.founding_count),
    foundingRemaining: earlyLeft,
    foundingTotal:     100,
    totalPaid,
    currentTier:       isEarly ? 'early' : isGrowth ? 'growth' : 'standard',
    currentPrice:      isEarly ? 29 : isGrowth ? 49 : 99,
    nextPrice:         isEarly ? 49 : isGrowth ? 99 : 99,
  });
}
