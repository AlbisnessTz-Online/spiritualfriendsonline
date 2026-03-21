
-- Create table for public member subscribers (people who register on homepage)
CREATE TABLE public.member_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  subscribed_daily_prayer BOOLEAN NOT NULL DEFAULT true,
  subscribed_announcements BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.member_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register as subscriber"
  ON public.member_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all subscribers"
  ON public.member_subscribers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update subscribers"
  ON public.member_subscribers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admins can delete subscribers"
  ON public.member_subscribers FOR DELETE
  TO authenticated
  USING (true);

CREATE TRIGGER update_member_subscribers_updated_at
  BEFORE UPDATE ON public.member_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
