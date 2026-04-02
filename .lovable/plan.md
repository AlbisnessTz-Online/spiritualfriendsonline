

## Problem

The SMS forwarder is successfully sending messages to the webhook, but the parser rejects them because:

1. **Transaction ID regex is too strict**: The current pattern `[A-Z]{2,4}\d{7,10}` only matches IDs like `QAZ1234567` (letters then digits). Real Tanzanian M-Pesa/M-KOBA transaction IDs are mixed alphanumeric like `SIK3HROXLE`, `RJD4ABCX2K`, etc.

2. **SMS forwarder field names vary**: Different apps send the SMS text under various field names (`smsText`, `sms_body`, `sms_message`, `fullSms`, etc.) that the current extractor may not cover.

## Plan

### Step 1: Fix the transaction ID regex in the edge function

Update the regex from `[A-Z]{2,4}\d{7,10}` to a broader alphanumeric pattern that matches real M-Pesa/M-KOBA IDs -- typically 10 uppercase alphanumeric characters at the start of the message.

New pattern: `\b([A-Z0-9]{8,12})\b` with a check that it contains both letters and digits.

### Step 2: Expand SMS field name extraction

Add more field name variants that popular SMS forwarder apps use: `smsText`, `sms_body`, `sms_message`, `fullSms`, `sms_text`, `payload`, `data`.

### Step 3: Add raw SMS logging for debugging

Store unrecognized SMS messages in a new `sms_logs` table so you can see what the forwarder is actually sending, making future debugging easier.

### Step 4: Test the fix

Use the edge function testing tool to confirm that mixed alphanumeric transaction IDs (like `SIK3HROXLE`) are now correctly parsed and saved.

### Technical Details

**File modified**: `supabase/functions/mpesa-sms-webhook/index.ts`
- Transaction ID regex: `\b([A-Z]{2,4}\d{7,10})\b` -> `\b([A-Z0-9]{8,12})\b` (with validation that it contains at least one letter and one digit)
- Additional SMS body field names in `extractSmsText()`

**New migration**: Create `sms_logs` table with columns `id`, `raw_body`, `parsed_ok`, `error_reason`, `created_at` -- using service role key (no RLS needed, only edge function writes to it). Admin-only SELECT policy for viewing logs.

