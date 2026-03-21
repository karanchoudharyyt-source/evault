// api/webhooks/lemonsqueezy.js
// Handles Lemon Squeezy subscription events
// Fires when user pays, cancels, or subscription renews

const SUPABASE_URL         = 'https://mhsbszeeepiqfypyejys.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLERK_SECRET_KEY     = process.env.CLERK_SECRET_KEY;
const LS_WEBHOOK_SECRET    = process.env.LS_WEBHOOK_SECRET;

import crypto from 'crypto';

function verifySignature(payload, signature, secret) {
  const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return hash === signature;
}

async function updateClerkPlan(clerkUserId, plan) {
  await fetch(`https://api.clerk.com/v1/users/${clerkUserId}/metadata`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ public_metadata: { plan } }),
  });
}

async function updateUser(clerkUserId, updates) {
  const headers = {
    'Content-Type':  'application/json',
    'apikey':        SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Prefer':        'return=minimal',
  };
  await fetch(
    `${SUPABASE_URL}/rest/v1/users?clerk_user_id=eq.${encodeURIComponent(clerkUserId)}`,
    { method: 'PATCH', headers, body: JSON.stringify(updates) }
  );
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Read raw body for signature verification
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');

  // Verify webhook signature
  const signature = req.headers['x-signature'];
  if (LS_WEBHOOK_SECRET && !verifySignature(rawBody, signature, LS_WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const payload = JSON.parse(rawBody);
  const eventName = payload.meta?.event_name;
  const data      = payload.data?.attributes;
  const custom    = payload.meta?.custom_data || data?.first_order_item?.custom || {};

  const clerkUserId    = custom.clerk_user_id;
  const subscriptionId = String(payload.data?.id || '');
  const customerId     = String(data?.customer_id || '');

  if (!clerkUserId) {
    console.warn('No clerk_user_id in webhook payload');
    return res.status(200).json({ received: true });
  }

  // Subscription created / payment success
  if (eventName === 'subscription_created' || eventName === 'order_created') {
    // Determine tier by variant name or price
    const variantName = data?.variant_name?.toLowerCase() ?? '';
    const plan = variantName.includes('early') ? 'early' : variantName.includes('growth') ? 'growth' : 'standard';

    await updateClerkPlan(clerkUserId, plan);
    await updateUser(clerkUserId, {
      plan,
      ls_subscription_id: subscriptionId,
      ls_customer_id:     customerId,
      sub_status:         'active',
      current_period_end: data?.renews_at ? new Date(data.renews_at).toISOString() : null,
    });
  }

  // Subscription renewed
  if (eventName === 'subscription_payment_success') {
    await updateUser(clerkUserId, {
      sub_status:         'active',
      current_period_end: data?.renews_at ? new Date(data.renews_at).toISOString() : null,
    });
  }

  // Subscription cancelled / expired
  if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
    await updateClerkPlan(clerkUserId, 'free');
    await updateUser(clerkUserId, {
      plan:               'free',
      sub_status:         eventName === 'subscription_cancelled' ? 'canceled' : 'expired',
      ls_subscription_id: null,
    });
  }

  // Payment failed
  if (eventName === 'subscription_payment_failed') {
    await updateUser(clerkUserId, { sub_status: 'past_due' });
  }

  return res.status(200).json({ received: true });
}
