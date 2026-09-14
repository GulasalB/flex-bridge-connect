-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  flex_year text NOT NULL DEFAULT '',
  host_country text NOT NULL DEFAULT '',
  host_state text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  contact_email text,
  linkedin_url text,
  instagram_url text,
  bio text NOT NULL DEFAULT '',
  participant_role text NOT NULL DEFAULT 'mentee',
  goals text[] NOT NULL DEFAULT '{}',
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by members" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, contact_email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Opportunities
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  event_date timestamptz NOT NULL,
  location text NOT NULL DEFAULT '',
  host_label text NOT NULL DEFAULT '',
  capacity integer NOT NULL DEFAULT 50,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opportunities readable" ON public.opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage opportunities" ON public.opportunities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (opportunity_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.rsvps TO authenticated;
GRANT ALL ON public.rsvps TO service_role;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rsvps readable" ON public.rsvps FOR SELECT TO authenticated USING (true);
CREATE POLICY "rsvp self" ON public.rsvps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "unrsvp self" ON public.rsvps FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Discussion
CREATE TABLE public.threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  author_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.threads TO authenticated;
GRANT ALL ON public.threads TO service_role;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "threads readable" ON public.threads FOR SELECT TO authenticated USING (true);
CREATE POLICY "create own thread" ON public.threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "manage own thread" ON public.threads FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "delete own thread" ON public.threads FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.replies TO authenticated;
GRANT ALL ON public.replies TO service_role;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "replies readable" ON public.replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "create own reply" ON public.replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "delete own reply" ON public.replies FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

-- Mentorships
CREATE TABLE public.mentorships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL,
  mentee_id uuid NOT NULL,
  goal text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mentor_id, mentee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorships TO authenticated;
GRANT ALL ON public.mentorships TO service_role;
ALTER TABLE public.mentorships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin mentorships readable" ON public.mentorships FOR SELECT TO authenticated
  USING (auth.uid() = mentor_id OR auth.uid() = mentee_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "request mentorship" ON public.mentorships FOR INSERT TO authenticated WITH CHECK (auth.uid() = mentee_id OR auth.uid() = mentor_id);
CREATE POLICY "update own mentorship" ON public.mentorships FOR UPDATE TO authenticated USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

CREATE TABLE public.mentorship_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_id uuid NOT NULL REFERENCES public.mentorships(id) ON DELETE CASCADE,
  title text NOT NULL,
  notes text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL DEFAULT 60,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorship_sessions TO authenticated;
GRANT ALL ON public.mentorship_sessions TO service_role;
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pair or admin sessions readable" ON public.mentorship_sessions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mentorships m WHERE m.id = mentorship_id AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid()))
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "pair logs sessions" ON public.mentorship_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND EXISTS (SELECT 1 FROM public.mentorships m WHERE m.id = mentorship_id AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid())));
CREATE POLICY "pair deletes sessions" ON public.mentorship_sessions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mentorships m WHERE m.id = mentorship_id AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid())));

CREATE TABLE public.mentorship_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_id uuid NOT NULL REFERENCES public.mentorships(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorship_goals TO authenticated;
GRANT ALL ON public.mentorship_goals TO service_role;
ALTER TABLE public.mentorship_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pair or admin goals readable" ON public.mentorship_goals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mentorships m WHERE m.id = mentorship_id AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid()))
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "pair writes goals" ON public.mentorship_goals FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.mentorships m WHERE m.id = mentorship_id AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid())));
CREATE POLICY "pair updates goals" ON public.mentorship_goals FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mentorships m WHERE m.id = mentorship_id AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid())));
CREATE POLICY "pair deletes goals" ON public.mentorship_goals FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mentorships m WHERE m.id = mentorship_id AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid())));