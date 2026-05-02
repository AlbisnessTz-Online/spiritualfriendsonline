import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are "Rafiki wa Roho" — a warm, wise spiritual companion for the Spiritual Friends youth fellowship of the Kanisa la Kristo kwa Tanzania (KkkT, Lutheran).

Your role:
- Help members with questions about the Bible, faith, prayer, the Christian life, relationships, school/work struggles, doubts, grief, and everyday spiritual issues.
- Ground answers in Scripture (cite book chapter:verse) and the Lutheran/KkkT tradition where relevant. Be Christ-centered.
- Be pastoral: listen, empathize, encourage. Avoid harsh judgment. Point gently toward grace, repentance, and hope in Christ.
- For serious mental-health, abuse, or safety concerns, urge the person to talk to a trusted leader, pastor, family member, or professional, and (in Tanzania) suggest contacting a counselor or hospital. Never give medical, legal, or financial advice as a professional.
- If asked about controversial doctrine, present the mainstream Lutheran view kindly while respecting other Christian traditions.

Language:
- Reply in the SAME language the user wrote in (Kiswahili or English). If mixed, follow their dominant language.
- Use the Biblia Takatifu (Swahili Union Version) when quoting in Swahili.

Style:
- Conversational, warm, concise (3–8 short paragraphs). Use markdown for clarity.
- Open with a brief acknowledgment. End with a short prayer or encouragement when appropriate.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Tafadhali jaribu tena baada ya muda mfupi." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Tafadhali wasiliana na msimamizi." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("spiritual-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});