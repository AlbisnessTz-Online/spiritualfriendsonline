import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// KkkT (Kanisa la Kristo kwa Tanzania) liturgical seasons helper
function getKkktLiturgicalContext(date: Date): string {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );

  // Easter calculation (Anonymous Gregorian algorithm)
  const Y = date.getFullYear();
  const a = Y % 19;
  const b = Math.floor(Y / 100);
  const c = Y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m2 = Math.floor((a + 11 * h + 22 * l) / 451);
  const easterMonth = Math.floor((h + l - 7 * m2 + 114) / 31);
  const easterDay = ((h + l - 7 * m2 + 114) % 31) + 1;
  const easterDate = new Date(Y, easterMonth - 1, easterDay);
  const easterDayOfYear = Math.floor(
    (easterDate.getTime() - new Date(Y, 0, 0).getTime()) / 86400000
  );
  const daysFromEaster = dayOfYear - easterDayOfYear;

  // Advent: 4 Sundays before Christmas (approx 1 Dec - 24 Dec)
  if (month === 12 && day >= 1 && day <= 24) {
    return "Kipindi cha Majilio (Advent) - wakati wa kusubiri kuja kwa Kristo";
  }
  // Christmas
  if ((month === 12 && day >= 25) || (month === 1 && day <= 6)) {
    return "Kipindi cha Kuzaliwa kwa Bwana (Christmas) - furaha ya kuzaliwa kwa Yesu";
  }
  // Epiphany season (Jan 7 - Ash Wednesday)
  if (month === 1 && day >= 7) {
    return "Kipindi cha Epifania - Ufunuo wa Bwana kwa mataifa";
  }
  // Lent (40 days before Easter)
  if (daysFromEaster >= -46 && daysFromEaster < 0) {
    if (daysFromEaster === -46) return "Jumatatu ya Majivu (Ash Wednesday) - mwanzo wa Kwaresma";
    return `Kipindi cha Kwaresma (Lent) - siku ${46 + daysFromEaster} ya tafakari na toba`;
  }
  // Holy Week
  if (daysFromEaster >= -7 && daysFromEaster < 0) {
    return "Wiki Takatifu - wiki ya mateso ya Bwana Yesu";
  }
  // Easter
  if (daysFromEaster === 0) return "Siku ya Pasaka! Yesu amefufuka! Aleluya!";
  if (daysFromEaster > 0 && daysFromEaster <= 50) {
    return `Kipindi cha Pasaka - siku ${daysFromEaster} baada ya ufufuko wa Bwana`;
  }
  // Pentecost
  if (daysFromEaster === 50) return "Siku ya Pentekosta - kushuka kwa Roho Mtakatifu";
  // Ordinary time
  if (month >= 2 && month <= 11) {
    return "Kipindi cha Kawaida - kukua katika imani na utumishi";
  }
  return "Kipindi cha Kawaida cha Kanisa";
}

function getTanzaniaDate(): Date {
  // UTC+3 for Tanzania
  const now = new Date();
  return new Date(now.getTime() + 3 * 60 * 60 * 1000);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Allow manual trigger or cron
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const today = getTanzaniaDate();
    const todayStr = today.toISOString().split("T")[0];

    // Check if a prayer already exists for today
    const { data: existing } = await supabase
      .from("prayers")
      .select("id")
      .eq("prayer_date", todayStr)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ message: "Prayer already exists for today", date: todayStr }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      );
    }

    const liturgicalContext = getKkktLiturgicalContext(today);
    const dayName = today.toLocaleDateString("sw-TZ", { weekday: "long" });
    const dateFormatted = today.toLocaleDateString("sw-TZ", {
      day: "numeric", month: "long", year: "numeric",
    });

    const prompt = `Wewe ni kiongozi wa kiroho wa Kanisa la Kristo kwa Tanzania (KkkT). 
Leo ni ${dayName}, ${dateFormatted}.
Kipindi cha Kanisa: ${liturgicalContext}

Tafadhali andika:
1. Mstari mmoja wa Biblia (kutoka toleo la Kiswahili - Biblia Takatifu) unaofaa kwa siku ya leo na kipindi hiki cha kanisa. Andika kitabu, sura na aya.
2. Maombi mafupi (mistari 4-6) kwa ajili ya vikundi vya vijana wa KkkT - Spiritual Friends - yanayohusiana na mstari huo na kipindi hiki.

Jibu kwa muundo huu HASA (bila maneno mengine):
TITLE: [kichwa kifupi cha kishairi cha maombi - maneno 3-6]
VERSE: [mstari wa Biblia - Kitabu Sura:Aya - "maandishi"]
PRAYER: [maombi]`;

    // Call Lovable AI (OpenAI compatible)
    const aiRes = await fetch("https://lovable.dev/functions/v1/ai-gateway", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", errText);
      throw new Error(`AI request failed: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const rawText: string = aiData.choices?.[0]?.message?.content ?? "";

    // Parse response
    const titleMatch = rawText.match(/TITLE:\s*(.+)/i);
    const verseMatch = rawText.match(/VERSE:\s*(.+)/i);
    const prayerMatch = rawText.match(/PRAYER:\s*([\s\S]+)/i);

    const title = titleMatch ? titleMatch[1].trim() : `Maombi ya ${dateFormatted}`;
    const verse = verseMatch ? verseMatch[1].trim() : "";
    const prayerBody = prayerMatch ? prayerMatch[1].trim() : rawText;

    // Combine verse + prayer into content
    const content = verse
      ? `📖 ${verse}\n\n${prayerBody}`
      : prayerBody;

    // Insert into prayers table as active
    const { error: insertError } = await supabase.from("prayers").insert({
      title,
      content,
      prayer_date: todayStr,
      is_active: true,
    });

    if (insertError) throw insertError;

    console.log(`✅ Auto-prayer created for ${todayStr}: "${title}"`);

    return new Response(
      JSON.stringify({ success: true, date: todayStr, title, context: liturgicalContext }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    console.error("auto-daily-prayer error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
