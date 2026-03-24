
-- ============================================================
-- SECURITY HARDENING: Fix all overly-permissive RLS policies
-- ============================================================

-- ---- 1. MEMBERS table ----
DROP POLICY IF EXISTS "Authenticated users can view members" ON public.members;
DROP POLICY IF EXISTS "Authenticated users can insert members" ON public.members;
DROP POLICY IF EXISTS "Authenticated users can update members" ON public.members;
DROP POLICY IF EXISTS "Authenticated users can delete members" ON public.members;

CREATE POLICY "Role users can view members" ON public.members
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Role users can insert members" ON public.members
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Role users can update members" ON public.members
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete members" ON public.members
  FOR DELETE USING (public.is_admin(auth.uid()));

-- ---- 2. TRANSACTIONS table ----
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can delete transactions" ON public.transactions;

CREATE POLICY "Role users can view transactions" ON public.transactions
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Role users can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Role users can update transactions" ON public.transactions
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete transactions" ON public.transactions
  FOR DELETE USING (public.is_admin(auth.uid()));

-- ---- 3. PRAYERS table ----
DROP POLICY IF EXISTS "Authenticated users can insert prayers" ON public.prayers;
DROP POLICY IF EXISTS "Authenticated users can update prayers" ON public.prayers;
DROP POLICY IF EXISTS "Authenticated users can delete prayers" ON public.prayers;

CREATE POLICY "Role users can insert prayers" ON public.prayers
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Role users can update prayers" ON public.prayers
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Role users can delete prayers" ON public.prayers
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

-- ---- 4. LEADER_INVITATIONS table ----
DROP POLICY IF EXISTS "Admins can insert invitations" ON public.leader_invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON public.leader_invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON public.leader_invitations;
DROP POLICY IF EXISTS "Authenticated users can view invitations" ON public.leader_invitations;

CREATE POLICY "Admins can insert invitations" ON public.leader_invitations
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update invitations" ON public.leader_invitations
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete invitations" ON public.leader_invitations
  FOR DELETE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view invitations" ON public.leader_invitations
  FOR SELECT USING (public.is_admin(auth.uid()));
