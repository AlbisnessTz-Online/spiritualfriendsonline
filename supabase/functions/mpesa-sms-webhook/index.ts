import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sms-forwarder-token',
};

function buildFallbackTransactionId(text: string): string {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }

  const normalized = Math.abs(hash).toString(36).toUpperCase().padStart(8, '0');
  return `SMS${normalized.slice(0, 9)}`;
}

// Parses M-Pesa and M-KOBA SMS text
function parseMpesaSms(text: string): {
  transaction_id: string;
  amount: number;
  phone_number: string;
  member_name: string;
  transaction_date: string;
} | null {
  const upper = text.toUpperCase();

  const isContributionSms = upper.includes('HAS CONTRIBUTED') && upper.includes('GROUP');

  // Must be an M-Pesa related message or a group contribution message
  if (!isContributionSms && !upper.includes('MPESA') && !upper.includes('M-PESA') && !upper.includes('CONFIRMED') && !upper.includes('RECEIVED') && !upper.includes('M-KOBA')) {
    return null;
  }

  // Transaction ID: 8-12 alphanumeric chars, must contain both letters and digits
  const txIdCandidates = text.match(/\b([A-Z0-9]{8,12})\b/g);
  let txId: string | null = null;
  if (txIdCandidates) {
    for (const candidate of txIdCandidates) {
      if (/[A-Z]/.test(candidate) && /[0-9]/.test(candidate)) {
        txId = candidate;
        break;
      }
    }
  }
  if (!txId && isContributionSms) {
    txId = buildFallbackTransactionId(text);
  }
  if (!txId) return null;

  // Amount: Tanzania messages may use TSh, KES, or TZS with punctuation
  const amountMatch =
    text.match(/(?:TSh|KES|TZS)\s*[.:]?\s*([\d,]+(?:\.\d{2})?)/i) ||
    text.match(/(?:received|sent|paid|contributed)\s+(?:TSh|KES|TZS)?\s*[.:]?\s*([\d,]+(?:\.\d{2})?)/i);
  if (!amountMatch) return null;

  // Tanzania phone numbers: 07xx, 06xx, 2557xx, +2557xx
  const phoneMatch = text.match(/(07\d{8}|06\d{8}|255\d{9}|\+255\d{9})/);

  // Name: between "from" or "received from" and phone/on
  const nameMatch =
    text.match(/([A-Z][A-Z\s]{2,60}?)\s*\((?:\+?255\d{9}|0\d{9})\)/i) ||
    text.match(/(?:from|received from|RECEIVED FROM|kutoka kwa)\s+([A-Z][A-Z\s]{2,40}?)(?:\s+\d|\s+on|\s+07|\s+06|\s+255)/i) ||
    text.match(/(?:sent to|kwenda kwa)\s+([A-Z][A-Z\s]{2,40}?)(?:\s+\d|\s+on|\s+07|\s+06|\s+255)/i) ||
    text.match(/([A-Z][A-Z\s]{2,60}?)\s+has contributed/i);

  // Date: format d/m/yy or d/m/yyyy or dd/mm/yy
  const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);

  const rawAmount = amountMatch[1].replace(/,/g, '');
  const amount = parseFloat(rawAmount);
  if (isNaN(amount) || amount <= 0) return null;

  const phone = phoneMatch ? phoneMatch[1] : 'Unknown';
  const name = nameMatch ? nameMatch[1].trim() : phone;

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
 */
async function extractSmsText(req: Request): Promise<string> {
  const contentType = req.headers.get('content-type') || '';
  const rawText = await req.text();

  if (!rawText || rawText.trim() === '') return '';

  // 1. Try JSON
  try {
    const body = JSON.parse(rawText);
    // Handle nested objects from some forwarder apps
    const source = body.payload || body.data || body;
    const smsText =
      source.message || source.sms || source.body || source.text ||
      source.content || source.msg || source.smsText || source.sms_body ||
      source.sms_message || source.fullSms || source.sms_text ||
      source.Message || source.SMS || source.Body ||
      body.message || body.sms || body.body || body.text ||
      body.content || body.msg || body.smsText || body.sms_body ||
      body.sms_message || body.fullSms || body.sms_text ||
      body.Message || body.SMS || body.Body ||
      '';
    if (smsText) return String(smsText);
  } catch {
    // Not JSON
  }

  // 2. Try URL-encoded form data
  if (contentType.includes('application/x-www-form-urlencoded') || rawText.includes('=')) {
    try {
      const params = new URLSearchParams(rawText);
      const keys = ['message', 'sms', 'body', 'text', 'content', 'msg',
        'smsText', 'sms_body', 'sms_message', 'fullSms', 'sms_text',
        'Message', 'SMS', 'Body'];
      for (const key of keys) {
        const val = params.get(key);
        if (val) return val;
      }
    } catch {
      // Not URL-encoded
    }
  }

  // 3. Raw text
  return rawText.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const webhookToken = Deno.env.get('SMS_WEBHOOK_TOKEN');

    // Optional: verify webhook token
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
      await logSms(supabase, '', false, 'Empty SMS body');
      return new Response(JSON.stringify({ error: 'No SMS text provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Received SMS text:', smsText.slice(0, 200));

    const parsed = parseMpesaSms(smsText);

    if (!parsed) {
      await logSms(supabase, smsText, false, 'Not a recognized M-Pesa transaction');
      return new Response(JSON.stringify({
        success: false,
        message: 'SMS is not a recognized M-Pesa transaction',
        sms_preview: smsText.slice(0, 100),
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upsert to transactions
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
      await logSms(supabase, smsText, false, `DB error: ${error.message}`);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await logSms(supabase, smsText, true, null);
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
    await logSms(supabase, '', false, `Exception: ${String(err)}`).catch(() => {});
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function logSms(supabase: any, rawBody: string, parsedOk: boolean, errorReason: string | null) {
  try {
    await supabase.from('sms_logs').insert({
      raw_body: rawBody.slice(0, 2000),
      parsed_ok: parsedOk,
      error_reason: errorReason,
    });
  } catch (e) {
    console.error('Failed to log SMS:', e);
  }
}
