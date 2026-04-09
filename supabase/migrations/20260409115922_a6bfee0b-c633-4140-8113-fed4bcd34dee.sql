
-- 1. Add financial_group to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'financial_group';

-- 2. Add category column to transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'weekly';

-- 3. Drop existing SELECT policy on transactions
DROP POLICY IF EXISTS "Role users can view transactions" ON public.transactions;

-- 4. Financial group + leaders can see ALL transactions
CREATE POLICY "Financial group and leaders can view all transactions"
ON public.transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

-- 5. Public can view udiakonia transactions (for the public page)
CREATE POLICY "Anyone can view udiakonia transactions"
ON public.transactions
FOR SELECT
TO anon
USING (category = 'udiakonia');
