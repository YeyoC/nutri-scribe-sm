
ALTER TABLE public.user_plans
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS stripe_session_id text;
