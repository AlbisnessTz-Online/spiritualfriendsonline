
CREATE POLICY "Anon can check own invitation by email"
  ON public.leader_invitations
  FOR SELECT
  TO anon
  USING (true);
