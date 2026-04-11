-- Fix 1: Remove overly permissive anon SELECT on leader_invitations
-- The handle_leader_signup trigger already looks up invitations server-side with SECURITY DEFINER
DROP POLICY IF EXISTS "Anon can check own invitation by email" ON public.leader_invitations;

-- Fix 2: Restrict member_subscribers INSERT to prevent self-verification
DROP POLICY IF EXISTS "Anyone can register as subscriber" ON public.member_subscribers;

CREATE POLICY "Anyone can register as subscriber"
ON public.member_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  is_verified = false
);