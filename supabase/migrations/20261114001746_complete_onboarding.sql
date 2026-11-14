-- Save onboarding in one transaction: public fields -> profiles, private fields ->
-- private_profiles. Either both writes succeed or neither does.
--
-- Why SECURITY DEFINER:
--   Clients can no longer write these rows directly. private_profiles grants
--   authenticated SELECT only, and the profiles INSERT policy is dropped below.
--   That closes the bypass where a client skips this function (and its 18+ check)
--   and writes a row with any birthday/age it likes. The function therefore runs
--   with its owner's rights so it can do the writes the caller can't.
--   What keeps it safe:
--     * the target row is always auth.uid(), never an id supplied by the client;
--     * it raises if there is no signed-in user;
--     * search_path = '' and every object is schema-qualified, so a caller can't
--       substitute their own tables or functions;
--     * EXECUTE is granted to authenticated only.

-- Profile rows are now created only through complete_onboarding.
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Existing verified_photos were set by the client and can't be trusted.
-- Clear them until real server-side verification exists.
UPDATE public.profiles SET verified_photos = '{}';

CREATE FUNCTION public.complete_onboarding(
  p_name               text,
  p_birthday           date,
  p_gender             text,
  p_looking_for        text,
  p_interests          text[],
  p_prompts            jsonb,
  p_dating_intent      text,
  p_preferred_age_min  integer,
  p_preferred_age_max  integer,
  p_preferred_distance integer,
  p_lifestyle          jsonb,
  p_career             jsonb,
  p_photos             text[],
  p_location_lat       double precision DEFAULT NULL,
  p_location_lng       double precision DEFAULT NULL
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_age integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_birthday IS NULL THEN
    RAISE EXCEPTION 'Birthday is required' USING ERRCODE = '22023';
  END IF;

  -- Full-date check: must have reached their 18th birthday as of today.
  IF p_birthday > (current_date - interval '18 years')::date THEN
    RAISE EXCEPTION 'You must be 18 or older to use COMET' USING ERRCODE = '22023';
  END IF;

  v_age := extract(year FROM age(current_date, p_birthday))::integer;

  -- verified_photos is always '{}' until server-side verification exists;
  -- the client's claim that a photo is "live" is not trusted.
  INSERT INTO public.profiles (
    id, name, age, gender, looking_for, interests, prompts, dating_intent,
    preferred_age_min, preferred_age_max, preferred_distance,
    lifestyle, career, photos, verified_photos
  )
  VALUES (
    v_uid, p_name, v_age, p_gender, p_looking_for,
    coalesce(p_interests, '{}'), coalesce(p_prompts, '[]'::jsonb), p_dating_intent,
    p_preferred_age_min, p_preferred_age_max, p_preferred_distance,
    p_lifestyle, p_career, p_photos, '{}'
  )
  ON CONFLICT (id) DO UPDATE SET
    name               = EXCLUDED.name,
    age                = EXCLUDED.age,
    gender             = EXCLUDED.gender,
    looking_for        = EXCLUDED.looking_for,
    interests          = EXCLUDED.interests,
    prompts            = EXCLUDED.prompts,
    dating_intent      = EXCLUDED.dating_intent,
    preferred_age_min  = EXCLUDED.preferred_age_min,
    preferred_age_max  = EXCLUDED.preferred_age_max,
    preferred_distance = EXCLUDED.preferred_distance,
    lifestyle          = EXCLUDED.lifestyle,
    career             = EXCLUDED.career,
    photos             = EXCLUDED.photos,
    verified_photos    = '{}';

  INSERT INTO public.private_profiles (id, birthday, location_lat, location_lng)
  VALUES (v_uid, p_birthday, p_location_lat, p_location_lng)
  ON CONFLICT (id) DO UPDATE SET
    birthday     = EXCLUDED.birthday,
    location_lat = EXCLUDED.location_lat,
    location_lng = EXCLUDED.location_lng;
END;
$$;

-- Only signed-in users may call it. Supabase grants EXECUTE on new public
-- functions to anon explicitly, so revoke from anon as well as PUBLIC.
REVOKE ALL ON FUNCTION public.complete_onboarding(
  text, date, text, text, text[], jsonb, text, integer, integer, integer,
  jsonb, jsonb, text[], double precision, double precision
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.complete_onboarding(
  text, date, text, text, text[], jsonb, text, integer, integer, integer,
  jsonb, jsonb, text[], double precision, double precision
) TO authenticated;
