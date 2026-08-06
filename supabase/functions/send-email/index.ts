import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import nodemailer from "npm:nodemailer@6.9.10";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text } = await req.json()

    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    if (!smtpPassword) {
      throw new Error("SMTP_PASSWORD secret is not configured in Supabase Edge Functions.");
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // use STARTTLS for port 587
      auth: {
        user: "classifiedallinon@gmail.com",
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Clean plain text fallback
    const plainText = text || html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    // Clean subject without emojis (emojis in subject cause Gmail spam score penalty)
    const cleanSubject = (subject || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

    await transporter.sendMail({
      from: '"All in One Marketplace" <classifiedallinon@gmail.com>',
      replyTo: 'classifiedallinon@gmail.com',
      to,
      subject: cleanSubject || subject,
      text: plainText,
      html: html || plainText,
      headers: {
        'Message-ID': `<${Date.now()}.${Math.random().toString(36).substring(2, 8)}@gmail.com>`,
        'X-Entity-Ref-ID': `${Date.now()}`,
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
      }
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error("Email send error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
