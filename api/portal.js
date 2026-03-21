// api/billing/portal.js
// Returns the Lemon Squeezy customer portal URL for managing subscription

const LS_API_KEY  = process.env.LEMONSQUEEZY_API_KEY;
const SUPABASE_URL         = 'https://mhsbszeeepiqfypyejys.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { clerkUserId } = req.body || {};
  if (!clerkUserId) return res.status(401).json({ error: 'Not authenticated' });

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  };

  // Get subscription ID from Supabase
  const userRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?clerk_user_id=eq.${encodeURIComponent(clerkUserId)}&select=ls_subscription_id,ls_customer_id`,
    { headers }
  );
  const users = await userRes.json();
  const user  = users?.[0];

  if (!user?.ls_subscription_id) {
    return res.status(400).json({ error: 'No active subscription found' });
  }

  // Get customer portal URL from Lemon Squeezy
  const subRes = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions/${user.ls_subscription_id}`,
    {
      headers: {
        'Accept':        'application/vnd.api+json',
        'Authorization': `Bearer ${LS_API_KEY}`,
      },
    }
  );
  const subData = await subRes.json();
  const portalUrl = subData.data?.attributes?.urls?.customer_portal;

  if (!portalUrl) return res.status(500).json({ error: 'Could not get portal URL' });

  return res.status(200).json({ url: portalUrl });
}
