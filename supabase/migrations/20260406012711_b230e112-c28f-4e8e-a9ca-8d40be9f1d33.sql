
-- Drop the permissive policy that lets regular users update their own plan (critical vulnerability)
DROP POLICY IF EXISTS "Users can update their own plan" ON public.user_plans;

-- Drop the permissive policy that lets regular users insert their own plan
-- (new user plans are created by the handle_new_user_plan trigger via SECURITY DEFINER)
DROP POLICY IF EXISTS "Users can insert their own plan" ON public.user_plans;
