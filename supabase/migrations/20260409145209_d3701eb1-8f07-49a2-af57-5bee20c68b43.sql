CREATE POLICY "Anyone can check invitations by email"
ON public.leader_invitations
FOR SELECT
TO anon
USING (true);