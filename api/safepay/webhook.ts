import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

const SAFEPAY_WEBHOOK_SECRET = process.env.SAFEPAY_WEBHOOK_SECRET || process.env.SAFEPAY_API_KEY || '';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const signature = (req.headers['x-safepay-signature'] || req.headers['x-sfpy-signature'] || '') as string;
    const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    // 1. Signature Verification (HMAC-SHA256)
    if (SAFEPAY_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', SAFEPAY_WEBHOOK_SECRET)
        .update(bodyStr)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.warn('Invalid Safepay webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const payload = req.body || {};
    const trackerToken = payload?.data?.token || payload?.tracker?.token || payload?.token || payload?.tracker;
    const state = (payload?.data?.state || payload?.state || payload?.status || '').toUpperCase();
    const txnId = payload?.data?.reference || payload?.reference || payload?.txn_id;

    if (!trackerToken) {
      return res.status(400).json({ error: 'No tracker token in webhook payload' });
    }

    // 2. Determine Payment Fulfillment Status
    let finalStatus = 'pending';
    if (state === 'PAID' || state === 'COMPLETED' || state === 'SUCCESS') {
      finalStatus = 'paid';
    } else if (state === 'FAILED' || state === 'DECLINED') {
      finalStatus = 'failed';
    } else if (state === 'CANCELLED') {
      finalStatus = 'cancelled';
    }

    // 3. Call Supabase RPC fulfill_safepay_promotion
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/fulfill_safepay_promotion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          p_tracker_token: trackerToken,
          p_status: finalStatus,
          p_txn_id: txnId || null,
        }),
      });
    }

    return res.status(200).json({ received: true, status: finalStatus });
  } catch (err: any) {
    console.error('Safepay webhook error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
