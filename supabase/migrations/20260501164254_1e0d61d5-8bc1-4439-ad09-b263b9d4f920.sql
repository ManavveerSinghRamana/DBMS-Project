
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'government', 'donor', 'public_user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF public.app_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phoneno TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_name, user_email, user_phoneno)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'user_phoneno'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'public_user'));

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ DISASTERS ============
CREATE TABLE public.disasters (
  disaster_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_name TEXT NOT NULL,
  disaster_type TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.disasters ENABLE ROW LEVEL SECURITY;

-- ============ AFFECTED AREAS ============
CREATE TABLE public.affected_areas (
  area_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_id UUID NOT NULL REFERENCES public.disasters(disaster_id) ON DELETE CASCADE,
  area_name TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  population INT NOT NULL DEFAULT 0,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.affected_areas ENABLE ROW LEVEL SECURITY;

-- ============ SHELTERS ============
CREATE TABLE public.shelters (
  shelter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES public.affected_areas(area_id) ON DELETE CASCADE,
  shelter_name TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity INT NOT NULL CHECK (capacity > 0),
  occupied_count INT NOT NULL DEFAULT 0,
  contact_number TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shelters ENABLE ROW LEVEL SECURITY;

-- Trigger: prevent over-capacity
CREATE OR REPLACE FUNCTION public.check_shelter_capacity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.occupied_count > NEW.capacity THEN
    RAISE EXCEPTION 'Occupied count (%) cannot exceed capacity (%)', NEW.occupied_count, NEW.capacity;
  END IF;
  IF NEW.occupied_count < 0 THEN
    RAISE EXCEPTION 'Occupied count cannot be negative';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_check_shelter_capacity
BEFORE INSERT OR UPDATE ON public.shelters
FOR EACH ROW EXECUTE FUNCTION public.check_shelter_capacity();

-- Shelter movements (intake/release) — drives occupied_count via trigger
CREATE TABLE public.shelter_movements (
  movement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shelter_id UUID NOT NULL REFERENCES public.shelters(shelter_id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('intake','release')),
  count INT NOT NULL CHECK (count > 0),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.shelter_movements ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.apply_shelter_movement()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.movement_type = 'intake' THEN
    UPDATE public.shelters
       SET occupied_count = occupied_count + NEW.count
     WHERE shelter_id = NEW.shelter_id;
  ELSE
    UPDATE public.shelters
       SET occupied_count = GREATEST(occupied_count - NEW.count, 0)
     WHERE shelter_id = NEW.shelter_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_apply_shelter_movement
AFTER INSERT ON public.shelter_movements
FOR EACH ROW EXECUTE FUNCTION public.apply_shelter_movement();

-- ============ DONATIONS ============
CREATE TABLE public.donations (
  donation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  donation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  message TEXT,
  disaster_id UUID REFERENCES public.disasters(disaster_id) ON DELETE SET NULL
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- ============ DISTRIBUTION ============
CREATE TABLE public.distribution (
  distribution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES public.affected_areas(area_id) ON DELETE CASCADE,
  material_name TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  distribution_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  admin_id UUID REFERENCES auth.users(id),
  notes TEXT
);
ALTER TABLE public.distribution ENABLE ROW LEVEL SECURITY;

-- ============ VIEWS ============
CREATE OR REPLACE VIEW public.v_disaster_overview AS
SELECT
  d.disaster_id,
  d.disaster_name,
  d.disaster_type,
  d.status,
  d.start_date,
  COUNT(DISTINCT a.area_id) AS affected_area_count,
  COALESCE(SUM(a.population), 0) AS total_affected_population,
  COUNT(DISTINCT s.shelter_id) AS shelter_count,
  COALESCE(SUM(s.capacity), 0) AS total_capacity,
  COALESCE(SUM(s.occupied_count), 0) AS total_occupied
FROM public.disasters d
LEFT JOIN public.affected_areas a ON a.disaster_id = d.disaster_id
LEFT JOIN public.shelters s ON s.area_id = a.area_id
GROUP BY d.disaster_id;

CREATE OR REPLACE VIEW public.v_donation_summary AS
SELECT
  date_trunc('day', donation_date)::date AS day,
  COUNT(*) AS donation_count,
  SUM(amount) AS total_amount
FROM public.donations
GROUP BY 1
ORDER BY 1;

-- ============ STORED PROCEDURES ============
CREATE OR REPLACE FUNCTION public.add_disaster(
  p_name TEXT, p_type TEXT, p_description TEXT, p_start_date DATE
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id UUID;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'government')) THEN
    RAISE EXCEPTION 'Only admin or government can add disasters';
  END IF;
  INSERT INTO public.disasters (disaster_name, disaster_type, description, start_date, created_by)
  VALUES (p_name, p_type, p_description, COALESCE(p_start_date, CURRENT_DATE), auth.uid())
  RETURNING disaster_id INTO new_id;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_donation(
  p_amount NUMERIC, p_disaster_id UUID, p_message TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  INSERT INTO public.donations (user_id, amount, disaster_id, message)
  VALUES (auth.uid(), p_amount, p_disaster_id, p_message)
  RETURNING donation_id INTO new_id;
  RETURN new_id;
END;
$$;

-- ============ RLS POLICIES ============
-- profiles
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- user_roles
CREATE POLICY "view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- disasters
CREATE POLICY "auth read disasters" ON public.disasters FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin/gov write disasters" ON public.disasters FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'government'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'government'));

-- areas
CREATE POLICY "auth read areas" ON public.affected_areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin/gov write areas" ON public.affected_areas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'government'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'government'));

-- shelters
CREATE POLICY "auth read shelters" ON public.shelters FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin/gov write shelters" ON public.shelters FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'government'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'government'));

-- shelter_movements
CREATE POLICY "auth read movements" ON public.shelter_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin/gov write movements" ON public.shelter_movements FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'government'));

-- donations
CREATE POLICY "donor read own, admin all" ON public.donations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'government'));
CREATE POLICY "donor insert own" ON public.donations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- distribution
CREATE POLICY "auth read distribution" ON public.distribution FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin/gov write distribution" ON public.distribution FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'government'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'government'));

-- Realtime for disasters (notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.disasters;
