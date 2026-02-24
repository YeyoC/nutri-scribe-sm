
-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Platillos table
CREATE TABLE public.platillos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  ingredientes jsonb DEFAULT '[]'::jsonb,
  desglose_ia jsonb DEFAULT '[]'::jsonb,
  total_kcal decimal DEFAULT 0,
  total_proteina decimal DEFAULT 0,
  total_grasas decimal DEFAULT 0,
  total_carbos decimal DEFAULT 0,
  edicion_smae text DEFAULT 'SMAE 2014',
  es_publico boolean DEFAULT false,
  link_compartir text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platillos ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own platillos
CREATE POLICY "Users can view their own platillos"
  ON public.platillos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own platillos"
  ON public.platillos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own platillos"
  ON public.platillos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own platillos"
  ON public.platillos FOR DELETE
  USING (auth.uid() = user_id);

-- Public platillos viewable by anyone via link
CREATE POLICY "Public platillos are viewable"
  ON public.platillos FOR SELECT
  USING (es_publico = true AND link_compartir IS NOT NULL);

CREATE TRIGGER update_platillos_updated_at
  BEFORE UPDATE ON public.platillos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
