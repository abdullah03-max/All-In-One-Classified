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

    // Create plain text fallback if not provided
    const plainText = text || html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

    await transporter.sendMail({
      from: '"All in One Marketplace" <classifiedallinon@gmail.com>',
      replyTo: '"All in One Marketplace" <classifiedallinon@gmail.com>',
      to,
      subject,
      text: plainText,
      html,
      headers: {
        'X-Mailer': 'AllInOneMarketplace/1.0',
        'X-Priority': '3',
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
