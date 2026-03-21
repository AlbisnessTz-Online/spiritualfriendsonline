import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sms-forwarder-token',
};

// Parses M-Pesa and M-KOBA SMS text
function parseMpesaSms(text: string): {
  transaction_id: string;
  amount: number;
  phone_number: string;
  member_name: string;
  transaction_date: string;
} | null {
  const upper = text.toUpperCase();

  // Must be an M-Pesa related message
  if (!upper.includes('MPESA') && !upper.includes('M-PESA') && !upper.includes('CONFIRMED') && !upper.includes('RECEIVED') && !upper.includes('M-KOBA')) {
    return null;
  }

  // Transaction ID: letters followed by digits e.g. QAZ1234567, SIK1234567
  const txIdMatch = text.match(/\b([A-Z]{2,4}\d{7,10})\b/);
  if (!txIdMatch) return null;

  // Amount: Tanzania M-Pesa uses TSh, but also accept KES/Tsh variants
  const amountMatch = text.match(/(?:TSh|KES|Tsh)\s*([\d,]+(?:\.\d{2})?)/i);
  if (!amountMatch) return null;

  // Tanzania phone numbers: 07xx, 06xx, 2557xx, +2557xx
  const phoneMatch = text.match(/(07\d{8}|06\d{8}|2557\d{8}|\+2557\d{8})/);

  // Name: between "from" or "received from" and phone/on
  const nameMatch =
    text.match(/(?:from|received from|RECEIVED FROM|kutoka kwa)\s+([A-Z][A-Z\s]{2,40}?)(?:\s+\d|\s+on|\s+07|\s+06|\s+255)/i) ||
    text.match(/(?:sent to|kwenda kwa)\s+([A-Z][A-Z\s]{2,40}?)(?:\s+\d|\s+on|\s+07|\s+06|\s+255)/i);

  // Date: format d/m/yy or d/m/yyyy or dd/mm/yy
  const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);

  const rawAmount = amountMatch[1].replace(/,/g, '');
  const amount = parseFloat(rawAmount);
  if (isNaN(amount) || amount <= 0) return null;

  const phone = phoneMatch ? phoneMatch[1] : 'Unknown';
  const name = nameMatch ? nameMatch[1].trim() : phone;
  const txId = txIdMatch[1];

  let transaction_date = new Date().toISOString().split('T')[0];
  if (dateMatch) {
    const parts = dateMatch[1].split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const year = y.length === 2 ? `20${y}` : y;
      const month = m.padStart(2, '0');
      const day = d.padStart(2, '0');
      const parsed = new Date(`${year}-${month}-${day}`);
      if (!isNaN(parsed.getTime())) {
        transaction_date = `${year}-${month}-${day}`;
      }
    }
  }

  return {
    transaction_id: txId,
    amount,
    phone_number: phone,
    member_name: name,
    transaction_date,
  };
}

/**
 * Robustly extract SMS text from any request format.
 * SMS forwarder apps send many different formats — handle them all.
 */
async function extractSmsText(req: Request): Promise<string> {
  const contentType = req.headers.get('content-type') || '';

  // Clone so we can read body multiple times if needed
  const rawText = await req.text();

  if (!rawText || rawText.trim() === '') return '';

  // 1. Try JSON first (works for application/json and some apps without proper content-type)
  try {
    const body = JSON.parse(rawText);
    const smsText =
      body.message ||
      body.sms ||
      body.body ||
      body.text ||
      body.content ||
      body.msg ||
      body.Message ||
      body.SMS ||
      body.Body ||
      '';
    if (smsText) return String(smsText);
  } catch {
    // Not JSON, continue
  }

  // 2. Try URL-encoded form data
  if (contentType.includes('application/x-www-form-urlencoded') || rawText.includes('=')) {
    try {
      const params = new URLSearchParams(rawText);
      const smsText =
        params.get('message') ||
        params.get('sms') ||
        params.get('body') ||
        params.get('text') ||
        params.get('content') ||
        params.get('msg') ||
        params.get('Message') ||
        params.get('SMS') ||
        params.get('Body') ||
        '';
      if (smsText) return smsText;
    } catch {
      // Not URL-encoded, continue
    }
  }

  // 3. Treat the raw body itself as the SMS text (some apps POST raw text)
  return rawText.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookToken = Deno.env.get('SMS_WEBHOOK_TOKEN');

    const supabase = createClient(supabaseUrl, serviceKey);

    // Optional: verify webhook token for security
    if (webhookToken) {
      const incomingToken =
        req.headers.get('x-sms-forwarder-token') ||
        new URL(req.url).searchParams.get('token');
      if (incomingToken !== webhookToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const smsText = await extractSmsText(req);

    if (!smsText) {
      return new Response(JSON.stringify({ error: 'No SMS text provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Received SMS text:', smsText.slice(0, 200));

    const parsed = parseMpesaSms(smsText);

    if (!parsed) {
      return new Response(JSON.stringify({
        success: false,
        message: 'SMS is not a recognized M-Pesa transaction',
        sms_preview: smsText.slice(0, 100),
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upsert to transactions (avoid duplicates by transaction_id)
    const { data, error } = await supabase
      .from('transactions')
      .upsert({
        transaction_id: parsed.transaction_id,
        member_name: parsed.member_name,
        phone_number: parsed.phone_number,
        amount: parsed.amount,
        transaction_date: parsed.transaction_date,
        source: 'sms_import',
        notes: 'Auto-imported via SMS forwarder',
      }, { onConflict: 'transaction_id' })
      .select()
      .single();

    if (error) {
      console.error('DB insert error:', error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Transaction saved:', parsed.transaction_id, parsed.amount);

    return new Response(JSON.stringify({
      success: true,
      message: 'Transaction saved',
      transaction: {
        id: data?.id,
        transaction_id: parsed.transaction_id,
        amount: parsed.amount,
        member_name: parsed.member_name,
        phone_number: parsed.phone_number,
        date: parsed.transaction_date,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
