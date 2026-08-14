import type { VercelRequest, VercelResponse } from '@vercel/node';

const SAFEPAY_API_KEY = process.env.SAFEPAY_API_KEY;
const SAFEPAY_MERCHANT_KEY = process.env.SAFEPAY_MERCHANT_KEY;
const SAFEPAY_ENV = process.env.SAFEPAY_ENV || 'sandbox';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const APP_URL = process.env.APP_URL || 'https://all-in-one-classified.vercel.app';

const PACKAGES: Record<string, { name: string; price: number; duration: number }> = {
  urgent: { name: 'Urgent Badge', price: 500, duration: 7 },
  featured: { name: 'Featured Ad', price: 1200, duration: 15 },
  vip: { name: 'Premium VIP', price: 2500, duration: 30 },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { listing_id, user_id, package_id } = req.body || {};

    if (!listing_id || !user_id || !package_id || !PACKAGES[package_id]) {
      return res.status(400).json({ error: 'Missing required parameters (listing_id, user_id, package_id)' });
    }

    const pkg = PACKAGES[package_id];
    const amountInPkr = pkg.price;
    const clientKey = SAFEPAY_MERCHANT_KEY || SAFEPAY_API_KEY || '';

    // 1. Call Safepay Sandbox API /order/v1/init to initialize tracker token
    const safepayHost = SAFEPAY_ENV === 'sandbox'
      ? 'https://sandbox.api.getsafepay.com'
      : 'https://api.getsafepay.com';

    const safepayResponse = await fetch(`${safepayHost}/order/v1/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client: clientKey,
        amount: amountInPkr,
        currency: 'PKR',
        environment: SAFEPAY_ENV,
      }),
    });

    const safepayData = await safepayResponse.json();

    const trackerToken = safepayData?.data?.token || safepayData?.tracker?.token || safepayData?.token;

    if (!trackerToken) {
      console.error('Safepay order init failed:', safepayData);
      const errMsg = safepayData?.status?.message || safepayData?.message || safepayData?.error || 'Failed to initialize payment tracker with Safepay API';
      return res.status(400).json({ error: errMsg, details: safepayData });
    }

    // 2. Insert pending payment record in Supabase
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          listing_id,
          user_id,
          amount: amountInPkr,
          currency: 'PKR',
          method: 'Safepay Sandbox',
          status: 'pending',
          tracker_token: trackerToken,
          package_name: pkg.name,
          duration_days: pkg.duration,
          gateway: 'Safepay Sandbox',
          notes: `Promotion: ${pkg.name} (${pkg.duration} Days)`,
        }),
      });
    }

    // 3. Construct Safepay Hosted Checkout URL
    const redirectUrl = `${APP_URL}/payment/status?tracker=${trackerToken}`;
    const checkoutUrl = `${safepayHost}/checkout/pay?tracker=${trackerToken}&beacon=${trackerToken}&env=${SAFEPAY_ENV}&environment=${SAFEPAY_ENV}&source=custom&merchant_key_id=${clientKey}&redirect_url=${encodeURIComponent(redirectUrl)}&cancel_url=${encodeURIComponent(redirectUrl)}`;

    return res.status(200).json({
      success: true,
      tracker_token: trackerToken,
      checkout_url: checkoutUrl,
    });
  } catch (err: any) {
    console.error('Error initiating Safepay tracker:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
