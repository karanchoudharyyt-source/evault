// api/webhooks/clerk.js
// Syncs Clerk user events to Supabase users table

const SUPABASE_URL = 'https://mhsbszeeepiqfypyejys.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

async function verifyClerkWebhook(req) {
  // Clerk signs webhooks with svix — verify signature
  const svix_id = req.headers['svix-id'];
  const svix_ts = req.headers['svix-timestamp'];
  const svix_sig = req.headers['svix-signature'];
  if (!svix_id || !svix_ts || !svix_sig) return false;
  // For now accept all — add svix verification in production
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const valid = await verifyClerkWebhook(req);
  if (!valid) return res.status(401).json({ error: 'Invalid signature' });

  const { type, data } = req.body;
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  };

  if (type === 'user.created' || type === 'user.updated') {
    const email = data.email_addresses?.[0]?.email_address ?? null;
    await fetch(`${SUPABASE_URL}/rest/v1/users?on_conflict=clerk_user_id`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        clerk_user_id: data.id,
        email,
        updated_at: new Date().toISOString(),
      }),
    });
  }

  if (type === 'user.deleted') {
    await fetch(
      `${SUPABASE_URL}/rest/v1/users?clerk_user_id=eq.${encodeURIComponent(data.id)}`,
      { method: 'DELETE', headers }
    );
  }

  return res.status(200).json({ received: true });
}
