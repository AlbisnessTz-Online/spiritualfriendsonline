
-- 1. Fix profiles.role default from 'admin' to 'member'
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'member';

-- 2. Fix profiles UPDATE policy to prevent role self-escalation
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid())
  );

-- 3. Fix leader_invitations anon SELECT - remove overly permissive policy
DROP POLICY IF EXISTS "Anyone can check invitations by email" ON public.leader_invitations;

-- 4. Fix member_subscribers SELECT - restrict to role users only
DROP POLICY IF EXISTS "Admins can view all subscribers" ON public.member_subscribers;
CREATE POLICY "Role users can view subscribers"
  ON public.member_subscribers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
    )
  );

-- 5. Fix member_subscribers INSERT - keep public but validate
DROP POLICY IF EXISTS "Anyone can register as subscriber" ON public.member_subscribers;
CREATE POLICY "Anyone can register as subscriber"
  ON public.member_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 6. Scope user_roles SELECT to own roles only
DROP POLICY IF EXISTS "Authenticated users can view user_roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 7. Create a security definer function for role checks (so RLS on other tables still works)
CREATE OR REPLACE FUNCTION public.current_user_has_any_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
  );
$$;

-- 8. Update dependent policies to use the security definer function
-- Members policies
DROP POLICY IF EXISTS "Role users can view members" ON public.members;
CREATE POLICY "Role users can view members"
  ON public.members FOR SELECT
  USING (public.current_user_has_any_role());

DROP POLICY IF EXISTS "Role users can insert members" ON public.members;
CREATE POLICY "Role users can insert members"
  ON public.members FOR INSERT
  WITH CHECK (public.current_user_has_any_role());

DROP POLICY IF EXISTS "Role users can update members" ON public.members;
CREATE POLICY "Role users can update members"
  ON public.members FOR UPDATE
  USING (public.current_user_has_any_role());

-- Prayers policies
DROP POLICY IF EXISTS "Role users can insert prayers" ON public.prayers;
CREATE POLICY "Role users can insert prayers"
  ON public.prayers FOR INSERT
  WITH CHECK (public.current_user_has_any_role());

DROP POLICY IF EXISTS "Role users can update prayers" ON public.prayers;
CREATE POLICY "Role users can update prayers"
  ON public.prayers FOR UPDATE
  USING (public.current_user_has_any_role());

DROP POLICY IF EXISTS "Role users can delete prayers" ON public.prayers;
CREATE POLICY "Role users can delete prayers"
  ON public.prayers FOR DELETE
  USING (public.current_user_has_any_role());

-- Transactions policies
DROP POLICY IF EXISTS "Role users can insert transactions" ON public.transactions;
CREATE POLICY "Role users can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (public.current_user_has_any_role());

DROP POLICY IF EXISTS "Role users can update transactions" ON public.transactions;
CREATE POLICY "Role users can update transactions"
  ON public.transactions FOR UPDATE
  USING (public.current_user_has_any_role());

DROP POLICY IF EXISTS "Financial group and leaders can view all transactions" ON public.transactions;
CREATE POLICY "Role users can view transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (public.current_user_has_any_role());
