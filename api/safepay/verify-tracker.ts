import type { VercelRequest, VercelResponse } from '@vercel/node';

const SAFEPAY_API_KEY = process.env.SAFEPAY_API_KEY;
const SAFEPAY_ENV = process.env.SAFEPAY_ENV || 'sandbox';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const trackerToken = (req.query.tracker || '') as string;
    if (!trackerToken) {
      return res.status(400).json({ error: 'Tracker parameter missing' });
    }

    const safepayHost = SAFEPAY_ENV === 'sandbox'
      ? 'https://sandbox.api.getsafepay.com'
      : 'https://api.getsafepay.com';

    // 1. Fetch tracker details directly from Safepay API
    const safepayResponse = await fetch(`${safepayHost}/order/v1/${trackerToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-SFPY-API-KEY': SAFEPAY_API_KEY || '',
      },
    });

    const safepayData = await safepayResponse.json();
    const state = (safepayData?.data?.state || safepayData?.state || safepayData?.status || '').toUpperCase();
    const txnId = safepayData?.data?.reference || safepayData?.reference;

    let finalStatus = 'pending';
    if (state === 'PAID' || state === 'COMPLETED' || state === 'SUCCESS') {
      finalStatus = 'paid';
    } else if (state === 'FAILED' || state === 'DECLINED') {
      finalStatus = 'failed';
    } else if (state === 'CANCELLED') {
      finalStatus = 'cancelled';
    }

    // 2. Fulfill promotion in Supabase instantly
    if (finalStatus === 'paid' && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/fulfill_safepay_promotion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          p_tracker_token: trackerToken,
          p_status: 'paid',
          p_txn_id: txnId || null,
        }),
      });
    }

    return res.status(200).json({ success: true, status: finalStatus, state });
  } catch (err: any) {
    console.error('Error verifying Safepay tracker:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
