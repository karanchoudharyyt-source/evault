// api/checkout.js — Lemon Squeezy checkout
const LS_API_KEY  = process.env.LEMONSQUEEZY_API_KEY;
const LS_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;
const VARIANTS = {
  early:    process.env.LS_VARIANT_EARLY,     // $29/mo — first 100
  growth:   process.env.LS_VARIANT_GROWTH,    // $49/mo — users 101-200
  standard: process.env.LS_VARIANT_STANDARD,  // $99/mo — open
};
const SUPABASE_URL         = 'https://mhsbszeeepiqfypyejys.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL              = process.env.VITE_APP_URL || 'https://evault-kappa.vercel.app';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { clerkUserId, email } = req.body || {};
  if (!clerkUserId || !email) return res.status(400).json({ error: 'Missing fields' });

  const dbH = { 'Content-Type':'application/json','apikey':SUPABASE_SERVICE_KEY,'Authorization':`Bearer ${SUPABASE_SERVICE_KEY}` };
  const statsRes = await fetch(`${SUPABASE_URL}/rest/v1/founding_stats`, { headers: dbH });
  const stats    = await statsRes.json();
  const earlyLeft  = Number(stats?.[0]?.founding_remaining ?? 0);
  const totalPaid  = Number(stats?.[0]?.total_paid ?? 0);

  const isEarly  = earlyLeft > 0;
  const isGrowth = !isEarly && totalPaid < 200;
  const tier     = isEarly ? 'early' : isGrowth ? 'growth' : 'standard';
  const variantId= VARIANTS[tier];
  const price    = isEarly ? 29 : isGrowth ? 49 : 99;

  if (!variantId) return res.status(500).json({ error: `LS_VARIANT_${tier.toUpperCase()} not set` });

  const lsRes = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: { 'Accept':'application/vnd.api+json','Content-Type':'application/vnd.api+json','Authorization':`Bearer ${LS_API_KEY}` },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: { email, custom: { clerk_user_id: clerkUserId } },
          product_options: { redirect_url:`${APP_URL}/?checkout=success`, receipt_link_url:`${APP_URL}/?checkout=success` },
          checkout_options: { embed:false, media:false, logo:true, discount:true },
        },
        relationships: {
          store:   { data: { type:'stores',   id: String(LS_STORE_ID) } },
          variant: { data: { type:'variants', id: String(variantId)  } },
        },
      },
    }),
  });

  if (!lsRes.ok) return res.status(500).json({ error: 'LS checkout failed', detail: await lsRes.text() });
  const d = await lsRes.json();
  const url = d.data?.attributes?.url;
  if (!url) return res.status(500).json({ error: 'No URL returned' });
  return res.status(200).json({ url, tier, price, earlyLeft });
}
