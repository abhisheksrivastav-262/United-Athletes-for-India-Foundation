-- ============================================================================
-- Migration: 20261010000001_customer_requirements.sql
-- Customer asks:
--  2-3. Remove player photos/names, keep sports + AI/generic photos
--  5. Information Bulletin via Articles category + events/locations already exist
--  6. Case studies table (admin CRUD + public pages)
--  7-8. Player registrations table (dashboard + email on connect)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 2-3. Remove personal player names + roster + personal article
-- ---------------------------------------------------------------------------
DELETE FROM public.team_athletes
WHERE athlete_id IN (SELECT id FROM public.athletes WHERE slug IN (
  'aarav-sharma','priya-patel','rohan-singh','ananya-iyer',
  'kabir-khan','meera-reddy','vikram-joshi','saanvi-mehta'
));

DELETE FROM public.athletes
WHERE slug IN (
  'aarav-sharma','priya-patel','rohan-singh','ananya-iyer',
  'kabir-khan','meera-reddy','vikram-joshi','saanvi-mehta'
);

DELETE FROM public.articles
WHERE slug IN ('priya-patel-selected-for-national-cricket-squad');

-- ---------------------------------------------------------------------------
-- Sports-only entries with AI/generic photos (from public/assets/)
-- ON CONFLICT (slug) DO UPDATE so reruns fix photos even if rows exist.
-- ---------------------------------------------------------------------------
INSERT INTO public.athletes (name, slug, sport, category, nationality, biography, achievements, photo, status, display_order)
VALUES
  ('Athletics (Track & Field)', 'athletics-track-and-field', 'Track & Field', 'Sprints, Relays, Jumps & Throws', 'India',
   'Comprehensive training and grassroots support for track and field events, fostering next-generation athletic talent across India.',
   'National Youth Podium Finishes, Grassroots Development in 12+ States',
   '/assets/about-athlete.jpg', 'published', 1),
  ('Badminton', 'badminton', 'Racquet Sports', 'Singles, Doubles & Mixed Doubles', 'India',
   'Elite coaching and equipment grants for promising badminton talent preparing for national circuits and international opens.',
   'All-India Junior Finalists, State Championships',
   '/assets/hero-athletes.jpg', 'published', 2),
  ('Football', 'football', 'Team Sports', 'Youth Academy & Grassroots Leagues', 'India',
   'Grassroots academies and tactical training camps empowering aspiring footballers across regional talent hubs.',
   'Inter-District Youth Champions, Academy Development',
   '/assets/community.jpg', 'published', 3),
  ('Cricket', 'cricket', 'Team Sports', 'Youth Development & Pace Bowling Camp', 'India',
   'Structured youth clinics, gear distribution, and coaching masterclasses nurturing grassroots cricket talent.',
   'State Junior League Champions, Grassroots Outreach',
   '/assets/equipment.jpg', 'published', 4),
  ('Wrestling', 'wrestling', 'Combat Sports', 'Freestyle & Greco-Roman', 'India',
   'Specialized mats, strength conditioning, and nutritional support for emerging wrestlers across India training centers.',
   'Cadet National Medals, Inter-State Tournament Gold',
   '/assets/facility.jpg', 'published', 5),
  ('Boxing', 'boxing', 'Combat Sports', 'Olympic Divisions & Youth Training', 'India',
   'Precision footwork, tactical spar conditioning, and tournament sponsorship for grassroots pugilists.',
   'Youth National Finalists, Regional Boxing Cups',
   '/assets/para-athlete.jpg', 'published', 6),
  ('Archery', 'archery', 'Precision Sports', 'Recurve & Compound', 'India',
   'High-grade bow kits, mental conditioning, and target training facilities supporting dedicated junior archers.',
   'National School Games Gold, State Archery Ranking',
   '/assets/programme-hero.jpg', 'published', 7),
  ('Swimming', 'swimming', 'Aquatics', 'Freestyle, Butterfly & Medley', 'India',
   'Pool access, technique coaching, and race preparation for competitive swimmers at state and national meets.',
   'State Junior Medals, Inter-Academy Swim Titles',
   '/assets/support.jpg', 'published', 8)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sport = EXCLUDED.sport,
  category = EXCLUDED.category,
  biography = EXCLUDED.biography,
  achievements = EXCLUDED.achievements,
  photo = EXCLUDED.photo,
  status = EXCLUDED.status,
  display_order = EXCLUDED.display_order;

-- ---------------------------------------------------------------------------
-- 5. Information Bulletin category (Articles & News -> Bulletin)
-- ---------------------------------------------------------------------------
INSERT INTO public.categories (name, slug, description)
VALUES ('Information Bulletin', 'information-bulletin', 'Upcoming events info, locations and announcements updated gradually.')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- ---------------------------------------------------------------------------
-- 6. Case studies table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL UNIQUE DEFAULT '',
  excerpt TEXT DEFAULT '',
  content TEXT DEFAULT '',
  featured_image TEXT DEFAULT '',
  location TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  display_order INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_studies_slug ON public.case_studies (slug);
CREATE INDEX IF NOT EXISTS idx_case_studies_status ON public.case_studies (status);

ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_case_studies" ON public.case_studies;
CREATE POLICY "public_read_published_case_studies" ON public.case_studies
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "admins_manage_case_studies" ON public.case_studies;
CREATE POLICY "admins_manage_case_studies" ON public.case_studies
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS update_case_studies_updated_at ON public.case_studies;
CREATE TRIGGER update_case_studies_updated_at
  BEFORE UPDATE ON public.case_studies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- 7. Player registrations table (players registered through website)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.player_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  age INTEGER,
  gender TEXT DEFAULT '',
  sport TEXT DEFAULT '',
  city TEXT DEFAULT '',
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'selected', 'rejected')),
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_registrations_status ON public.player_registrations (status);
CREATE INDEX IF NOT EXISTS idx_player_registrations_created ON public.player_registrations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_player_registrations_email ON public.player_registrations (email);
CREATE INDEX IF NOT EXISTS idx_player_registrations_sport ON public.player_registrations (sport);

ALTER TABLE public.player_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_player_registrations" ON public.player_registrations;
CREATE POLICY "public_insert_player_registrations" ON public.player_registrations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admins_manage_player_registrations" ON public.player_registrations;
CREATE POLICY "admins_manage_player_registrations" ON public.player_registrations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS update_player_registrations_updated_at ON public.player_registrations;
CREATE TRIGGER update_player_registrations_updated_at
  BEFORE UPDATE ON public.player_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- Nav: Case Studies link (admin can reorder/hide from /admin/navigation)
-- ---------------------------------------------------------------------------
INSERT INTO public.navigation_items (label, href, is_external, is_active, display_order)
SELECT 'Case Studies', '/case-studies', false, true,
  COALESCE((SELECT MAX(display_order) FROM public.navigation_items), 9) + 1
WHERE NOT EXISTS (SELECT 1 FROM public.navigation_items WHERE href = '/case-studies');
