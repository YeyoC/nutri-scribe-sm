
-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all user_plans
CREATE POLICY "Admins can view all plans"
ON public.user_plans FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update any user_plan
CREATE POLICY "Admins can update any plan"
ON public.user_plans FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can view all ai_usage_log
CREATE POLICY "Admins can view all ai usage"
ON public.ai_usage_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
