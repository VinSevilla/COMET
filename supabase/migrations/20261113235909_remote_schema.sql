SET local check_function_bodies = off;

CREATE TABLE "public"."matches" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user1_id"         uuid,
  "user2_id"         uuid,
  "created_at"       timestamp with time zone DEFAULT now(),
  "status"           text                     DEFAULT 'collided'::text,
  "orbit_level"      integer                  DEFAULT 0,
  "last_activity"    timestamp with time zone DEFAULT now(),
  "orbit_started_at" timestamp with time zone,
  CONSTRAINT "matches_pkey" PRIMARY KEY (id),
  CONSTRAINT "matches_status_check" CHECK ((status = ANY (ARRAY['collided'::text, 'orbit'::text, 'committed'::text, 'drifted'::text]))),
  CONSTRAINT "matches_user1_id_user2_id_key" UNIQUE (user1_id, user2_id)
);

ALTER TABLE "public"."matches"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."messages" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "match_id"   uuid,
  "sender_id"  uuid,
  "content"    text                     NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "messages_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."messages"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."orbit_events" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "match_id"     uuid,
  "event_type"   text,
  "triggered_by" uuid,
  "created_at"   timestamp with time zone DEFAULT now(),
  CONSTRAINT "orbit_events_event_type_check" CHECK ((event_type = ANY (ARRAY['entered'::text, 'committed'::text, 'drifted'::text, 'dissolved'::text]))),
  CONSTRAINT "orbit_events_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."orbit_events"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"                 uuid                     NOT NULL,
  "name"               text,
  "age"                integer,
  "bio"                text,
  "gender"             text,
  "looking_for"        text,
  "university"         text,
  "photos"             text[],
  "created_at"         timestamp with time zone DEFAULT now(),
  "last_active"        timestamp with time zone DEFAULT now(),
  "is_in_orbit"        boolean                  DEFAULT false,
  "signal_count_today" integer                  DEFAULT 0,
  "signal_reset_at"    timestamp with time zone DEFAULT now(),
  "location_lat"       double precision,
  "location_lng"       double precision,
  "birthday"           date,
  "interests"          text[]                   DEFAULT '{}'::text[],
  "prompts"            jsonb                    DEFAULT '[]'::jsonb,
  "dating_intent"      text,
  "preferred_age_min"  integer,
  "preferred_age_max"  integer,
  "preferred_distance" integer,
  "lifestyle"          jsonb,
  "career"             jsonb,
  "verified_photos"    text[]                   DEFAULT '{}'::text[],
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."signals" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "swiper_id"  uuid,
  "swiped_id"  uuid,
  "type"       text,
  "created_at" timestamp with time zone DEFAULT now(),
  "date"       date                     DEFAULT CURRENT_DATE,
  CONSTRAINT "swipes_direction_check" CHECK ((type = ANY (ARRAY['like'::text, 'pass'::text]))),
  CONSTRAINT "swipes_pkey" PRIMARY KEY (id),
  CONSTRAINT "swipes_swiper_id_swiped_id_key" UNIQUE (swiper_id, swiped_id)
);

ALTER TABLE "public"."signals"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

ALTER TABLE "public"."matches"
  ADD CONSTRAINT "matches_user1_id_fkey" FOREIGN KEY (user1_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."matches"
  ADD CONSTRAINT "matches_user2_id_fkey" FOREIGN KEY (user2_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."messages"
  ADD CONSTRAINT "messages_match_id_fkey" FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;

ALTER TABLE "public"."messages"
  ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."orbit_events"
  ADD CONSTRAINT "orbit_events_match_id_fkey" FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;

ALTER TABLE "public"."orbit_events"
  ADD CONSTRAINT "orbit_events_triggered_by_fkey" FOREIGN KEY (triggered_by) REFERENCES auth.users(id);

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."signals"
  ADD CONSTRAINT "swipes_swiped_id_fkey" FOREIGN KEY (swiped_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."signals"
  ADD CONSTRAINT "swipes_swiper_id_fkey" FOREIGN KEY (swiper_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE POLICY "Users can insert matches" ON "public"."matches"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((auth.uid() = user1_id) OR (auth.uid() = user2_id)));

CREATE POLICY "Users can read their own matches" ON "public"."matches"
  FOR SELECT
  TO PUBLIC
  USING (((auth.uid() = user1_id) OR (auth.uid() = user2_id)));

CREATE POLICY "Users can update their own matches" ON "public"."matches"
  FOR UPDATE
  TO PUBLIC
  USING (((auth.uid() = user1_id) OR (auth.uid() = user2_id)));

CREATE POLICY "Users can insert messages in their matches" ON "public"."messages"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM public.matches
  WHERE ((matches.id = messages.match_id) AND ((matches.user1_id = auth.uid()) OR (matches.user2_id = auth.uid())))))));

CREATE POLICY "Users can read messages in their matches" ON "public"."messages"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.matches
  WHERE ((matches.id = messages.match_id) AND ((matches.user1_id = auth.uid()) OR (matches.user2_id = auth.uid()))))));

CREATE POLICY "Users can read orbit events for their matches" ON "public"."orbit_events"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.matches
  WHERE ((matches.id = orbit_events.match_id) AND ((matches.user1_id = auth.uid()) OR (matches.user2_id = auth.uid()))))));

CREATE POLICY "Profiles are viewable by everyone" ON "public"."profiles"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Users can insert their own profile" ON "public"."profiles"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = id));

CREATE POLICY "Users can update their own profile" ON "public"."profiles"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = id));

CREATE POLICY "Users can insert their own swipes" ON "public"."signals"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = swiper_id));

CREATE POLICY "Users can read signals targeting them" ON "public"."signals"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = swiped_id));

CREATE POLICY "Users can read their own swipes" ON "public"."signals"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = swiper_id));

CREATE POLICY "Public read profile photos" ON "storage"."objects"
  FOR SELECT
  TO PUBLIC
  USING ((bucket_id = 'profile-photos'::text));

CREATE POLICY "Users update own profile photos" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'profile-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Users upload own profile photos" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'profile-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."messages";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."matches" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."matches" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."matches" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."matches" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."messages" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."messages" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."messages" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."messages" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."orbit_events" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."orbit_events" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."orbit_events" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."orbit_events" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."signals" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."signals" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."signals" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."signals" TO "service_role";

