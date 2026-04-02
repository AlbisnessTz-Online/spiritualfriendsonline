
CREATE TABLE public.sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_body text NOT NULL,
  parsed_ok boolean NOT NULL DEFAULT false,
  error_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sms_logs"
ON public.sms_logs
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));
