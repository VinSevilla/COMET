-- Stopgap: profiles were readable by anyone holding the anon key (TO PUBLIC USING (true)).
-- Restrict reads to signed-in users. Private columns are moved out in the next migration.

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
