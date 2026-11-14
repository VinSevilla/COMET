-- Move sensitive fields (birthday, exact location) out of public.profiles into an
-- owner-only table. RLS is row-level, so a separate table is the only way to hide
-- these columns while other users can still read the public profile row.

-- 1. Table -------------------------------------------------------------------
CREATE TABLE public.private_profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  birthday     date,
  location_lat double precision,
  location_lng double precision,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.private_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Privileges --------------------------------------------------------------
-- Supabase grants ALL on new public tables to anon/authenticated by default.
-- Tighten that: anon gets nothing; authenticated may only read. All writes go
-- through public.complete_onboarding (SECURITY DEFINER), which validates input.
REVOKE ALL ON TABLE public.private_profiles FROM anon, authenticated;
GRANT SELECT ON TABLE public.private_profiles TO authenticated;

-- 3. Policies (owner-only read; no INSERT/UPDATE policies on purpose) --------
CREATE POLICY "Users can read their own private profile"
  ON public.private_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 4. Keep updated_at honest on every UPDATE ----------------------------------
CREATE FUNCTION public.private_profiles_set_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER private_profiles_set_updated_at
  BEFORE UPDATE ON public.private_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.private_profiles_set_updated_at();

-- 5. Copy existing data ------------------------------------------------------
INSERT INTO public.private_profiles (id, birthday, location_lat, location_lng)
SELECT id, birthday, location_lat, location_lng
FROM public.profiles
WHERE birthday IS NOT NULL
   OR location_lat IS NOT NULL
   OR location_lng IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 6. Safety check: abort (and roll back) if any value failed to copy ---------
DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM public.profiles p
  LEFT JOIN public.private_profiles pp ON pp.id = p.id
  WHERE (p.birthday     IS NOT NULL AND pp.birthday     IS DISTINCT FROM p.birthday)
     OR (p.location_lat IS NOT NULL AND pp.location_lat IS DISTINCT FROM p.location_lat)
     OR (p.location_lng IS NOT NULL AND pp.location_lng IS DISTINCT FROM p.location_lng);

  IF missing > 0 THEN
    RAISE EXCEPTION 'private_profiles copy incomplete: % profile(s) not copied; aborting before dropping columns', missing;
  END IF;
END;
$$;

-- 7. Remove the now-copied columns from the public table --------------------
ALTER TABLE public.profiles
  DROP COLUMN birthday,
  DROP COLUMN location_lat,
  DROP COLUMN location_lng;
