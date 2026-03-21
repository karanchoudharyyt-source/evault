// api/subscribe-refresh.js
// Re-syncs a push subscription on page load WITHOUT overwriting pack_ids
// Called automatically every time the site opens if permission is already granted

const SUPABASE_URL = 'https://mhsbszeeepiqfypyejys.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oc2JzemVlZXBpcWZ5cHllanlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDAzNjYsImV4cCI6MjA4OTMxNjM2Nn0.pBaT3-76zgpREXUIiFso6HyHRdjhcQ1joT9TqLJkaJo';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { endpoint, p256dh, auth } = req.body || {};
  if (!endpoint || !p256dh || !auth) {
    return res.status(400).json({ error: 'endpoint, p256dh, auth required' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Prefer': 'resolution=merge-duplicates,return=minimal',
  };

  // Check if subscription already exists
  const check = await fetch(
    `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}&select=endpoint,pack_ids`,
    { headers }
  );
  const existing = await check.json();

  if (existing?.length > 0) {
    // Row exists — just update the keys + timestamp, preserve everything else
    await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ p256dh, auth, updated_at: new Date().toISOString() }),
      }
    );
    return res.status(200).json({ status: 'refreshed', packIds: existing[0].pack_ids });
  } else {
    // No row — insert fresh with empty pack_ids
    await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?on_conflict=endpoint`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          endpoint, p256dh, auth,
          pack_ids: [],
          alert_on_ev: true, alert_on_buyback: true,
          ev_threshold: 1.0, alert_type: 'all',
          updated_at: new Date().toISOString(),
        }),
      }
    );
    return res.status(200).json({ status: 'created' });
  }
}
