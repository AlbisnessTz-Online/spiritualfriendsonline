import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Use Tanzania timezone (UTC+3) so the date matches the locally-scheduled prayer
    const tzNow = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const today = tzNow.toISOString().split('T')[0];

    // Get today's active prayer
    const { data: prayer, error: prayerError } = await supabase
      .from('prayers')
      .select('title, content, prayer_date')
      .eq('prayer_date', today)
      .eq('is_active', true)
      .maybeSingle();

    if (prayerError) throw prayerError;
    if (!prayer) {
      return new Response(JSON.stringify({ success: false, message: 'No prayer found for today' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all subscribers with daily prayer enabled
    const { data: subscribers, error: subError } = await supabase
      .from('member_subscribers')
      .select('full_name, email')
      .eq('subscribed_daily_prayer', true);

    if (subError) throw subError;
    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No subscribers found', sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send email to each subscriber using Lovable AI gateway
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    let sent = 0;
    const errors: string[] = [];

    for (const sub of subscribers) {
      try {
        const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1d4ed8,#16a34a);padding:32px 28px;text-align:center;">
      <div style="display:inline-block;width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:14px;line-height:52px;font-size:26px;margin-bottom:12px;">✝</div>
      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Spiritual Friends</h1>
      <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Daily Prayer — ${prayer.prayer_date}</p>
    </div>
    <!-- Body -->
    <div style="padding:28px 28px 20px;">
      <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">Habari za asubuhi, <strong style="color:#111827;">${sub.full_name}</strong> 🙏</p>
      <h2 style="color:#111827;font-size:18px;font-weight:700;margin:0 0 12px;border-left:4px solid #1d4ed8;padding-left:12px;">${prayer.title}</h2>
      <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 24px;">${prayer.content.replace(/\n/g, '<br>')}</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;text-align:center;margin-bottom:20px;">
        <p style="color:#16a34a;font-size:13px;margin:0;font-style:italic;">"For where two or three gather in my name, there am I with them." — Matthew 18:20</p>
      </div>
    </div>
    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 28px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Spiritual Friends · Tanzania ✝️</p>
      <p style="color:#9ca3af;font-size:11px;margin:6px 0 0;">You received this because you subscribed for daily prayers.</p>
    </div>
  </div>
</body>
</html>`;

        const res = await fetch('https://gateway.lovable.dev/v1/send-email', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: sub.email,
            subject: `🙏 Daily Prayer: ${prayer.title}`,
            html: emailHtml,
            from_name: 'Spiritual Friends',
          }),
        });

        if (res.ok) {
          sent++;
        } else {
          const errText = await res.text();
          errors.push(`${sub.email}: ${errText}`);
        }
      } catch (e) {
        errors.push(`${sub.email}: ${String(e)}`);
      }
    }

    console.log(`Daily prayer sent to ${sent}/${subscribers.length} subscribers`);

    return new Response(JSON.stringify({
      success: true,
      prayer_title: prayer.title,
      total_subscribers: subscribers.length,
      sent,
      errors,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Error sending daily prayer:', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
