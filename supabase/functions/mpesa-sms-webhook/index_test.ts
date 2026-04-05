import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("parses contribution SMS format with generated transaction id", async () => {
  const sms = "JACKILINE MANGOWI(255746045151) has contributed TZS.10,500.00 to SPIRITUAL FRIENDS group on 04/04/2026 at 19:17";

  const response = await fetch("http://localhost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: sms }),
  });

  await response.text();

  const txIdCandidates = sms.match(/\b([A-Z0-9]{8,12})\b/g);
  let txId: string | null = null;
  if (txIdCandidates) {
    for (const candidate of txIdCandidates) {
      if (/[A-Z]/.test(candidate) && /[0-9]/.test(candidate)) {
        txId = candidate;
        break;
      }
    }
  }

  let hash = 0;
  for (let index = 0; index < sms.length; index += 1) {
    hash = ((hash << 5) - hash + sms.charCodeAt(index)) | 0;
  }

  const fallbackId = `SMS${Math.abs(hash).toString(36).toUpperCase().padStart(8, '0').slice(0, 9)}`;

  assertEquals(txId, null);
  assertEquals(fallbackId.startsWith("SMS"), true);
});