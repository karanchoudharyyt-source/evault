// api/billing/checkout.js
// Creates a Lemon Squeezy checkout for PackPulse Pro
// Lemon Squeezy = Merchant of Record — works perfectly for Indian founders selling globally
// No US entity needed, handles all tax compliance, pays out to Indian bank in USD

const LS_API_KEY  = process.env.LEMONSQUEEZY_API_KEY;
const LS_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;

// Variant IDs — create in Lemon Squeezy dashboard under Products
const VARIANTS = {
  founding: process.env.LS_VARIANT_FOUNDING,  // $19/mo — first 25 users
  standard: process.env.LS_VARIANT_STANDARD,  // $29/mo — after 25 users
};

const SUPABASE_URL         = 'https://mhsbszeeepiqfypyejys.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL              = process.env.VITE_APP_URL || 'https://packpulse.io';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { clerkUserId, email } = req.body || {};
  if (!clerkUserId || !email) return res.status(400).json({ error: 'clerkUserId and email required' });

  const dbHeaders = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  };

  // Check founding spots remaining
  const statsRes  = await fetch(`${SUPABASE_URL}/rest/v1/founding_stats`, { headers: dbHeaders });
  const stats     = await statsRes.json();
  const foundingLeft = Number(stats?.[0]?.founding_remaining ?? 0);

  const isFounding = foundingLeft > 0;
  const variantId  = isFounding ? VARIANTS.founding : VARIANTS.standard;

  if (!variantId) return res.status(500).json({ error: 'Variant ID not configured in environment' });

  // Create Lemon Squeezy checkout session
  const lsRes = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      'Accept':        'application/vnd.api+json',
      'Content-Type':  'application/vnd.api+json',
      'Authorization': `Bearer ${LS_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email,
            custom: { clerk_user_id: clerkUserId },
          },
          product_options: {
            redirect_url:     `${APP_URL}/?checkout=success`,
            receipt_link_url: `${APP_URL}/?checkout=success`,
          },
          checkout_options: {
            embed:    false,
            media:    false,
            logo:     true,
            discount: true,
          },
        },
        relationships: {
          store:   { data: { type: 'stores',   id: String(LS_STORE_ID) } },
          variant: { data: { type: 'variants', id: String(variantId)  } },
        },
      },
    }),
  });

  if (!lsRes.ok) {
    const err = await lsRes.text();
    console.error('LS checkout error:', err);
    return res.status(500).json({ error: 'Failed to create checkout' });
  }

  const data = await lsRes.json();
  const url  = data.data?.attributes?.url;
  if (!url) return res.status(500).json({ error: 'No checkout URL returned' });

  return res.status(200).json({ url, isFounding, foundingLeft, price: isFounding ? 19 : 29 });
}
