// api/subscribe.js
// Saves browser push subscription + pack alert preferences to Supabase
// Uses anon key (safe because RLS is open for this use case)

const SUPABASE_URL = 'https://mhsbszeeepiqfypyejys.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oc2JzemVlZXBpcWZ5cHllanlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDAzNjYsImV4cCI6MjA4OTMxNjM2Nn0.pBaT3-76zgpREXUIiFso6HyHRdjhcQ1joT9TqLJkaJo';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };

  // ── POST: save / update subscription ──
  if (req.method === 'POST') {
    const { subscription, packIds, alertOnEv, alertOnBuyback, evThreshold } = req.body || {};

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    const payload = {
      endpoint:         subscription.endpoint,
      p256dh:           subscription.keys.p256dh,
      auth:             subscription.keys.auth,
      pack_ids:         packIds   || [],
      alert_on_ev:      alertOnEv ?? true,
      alert_on_buyback: alertOnBuyback ?? true,
      ev_threshold:     evThreshold ?? 1.0,
      updated_at:       new Date().toISOString(),
    };

    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?on_conflict=endpoint`,
      {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(payload),
      }
    );

    if (!r.ok) {
      const err = await r.text();
      return res.status(500).json({ error: 'Failed to save subscription', detail: err });
    }

    return res.status(200).json({ success: true, packIds: payload.pack_ids });
  }

  // ── DELETE: remove subscription ──
  if (req.method === 'DELETE') {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ error: 'endpoint required' });

    await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
      { method: 'DELETE', headers }
    );

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
