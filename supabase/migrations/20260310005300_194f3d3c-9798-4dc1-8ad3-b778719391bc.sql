
-- Function to get admin user data (includes email and last sign in from auth.users)
CREATE OR REPLACE FUNCTION public.get_admin_users_data()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  plan text,
  is_banned boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS user_id,
    au.email::text,
    p.display_name,
    p.avatar_url,
    p.created_at,
    au.last_sign_in_at,
    COALESCE(up.plan, 'gratis') AS plan,
    COALESCE(au.banned_until > now(), false) AS is_banned
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  LEFT JOIN public.user_plans up ON up.user_id = p.id
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY p.created_at DESC;
$$;
