
-- Fix overly permissive UPDATE/DELETE/INSERT policies on member_subscribers
DROP POLICY IF EXISTS "Admins can update subscribers" ON public.member_subscribers;
DROP POLICY IF EXISTS "Admins can delete subscribers" ON public.member_subscribers;

CREATE POLICY "Admins can update subscribers" ON public.member_subscribers
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete subscribers" ON public.member_subscribers
  FOR DELETE USING (public.is_admin(auth.uid()));
