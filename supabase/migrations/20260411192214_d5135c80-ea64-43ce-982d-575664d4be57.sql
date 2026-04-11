-- Remove the anon SELECT policy that exposes financial data publicly
DROP POLICY IF EXISTS "Anyone can view udiakonia transactions" ON public.transactions;