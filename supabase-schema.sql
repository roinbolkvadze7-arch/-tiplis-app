-- ============================================================
-- შესყიდვის აქტი — Supabase Database Schema
-- გაუშვით Supabase SQL Editor-ში (ერთხელ, ან დაარედაქტირეთ პოლიტიკები ხელით)
-- ============================================================

-- 1. მომხმარებლების ცხრილი (public.users — არ ერევა auth.users-ს)
CREATE TABLE IF NOT EXISTS public.users (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  pid        TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. გამყიდველების ცხრილი
CREATE TABLE IF NOT EXISTS public.sellers (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  pid        TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. შესყიდვის აქტების ცხრილი
CREATE TABLE IF NOT EXISTS public.acts (
  id            BIGSERIAL PRIMARY KEY,
  act_date      DATE NOT NULL,
  display_date  TEXT NOT NULL,
  buyer_name    TEXT NOT NULL,
  buyer_pid     TEXT,
  seller_name   TEXT NOT NULL,
  seller_pid    TEXT,
  manager_name  TEXT,
  goods         JSONB NOT NULL DEFAULT '[]',
  total         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_words   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Row Level Security
ALTER TABLE public.users   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acts    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_users"   ON public.users;
DROP POLICY IF EXISTS "allow_all_sellers" ON public.sellers;
DROP POLICY IF EXISTS "allow_all_acts"    ON public.acts;

CREATE POLICY "allow_all_users"   ON public.users   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_sellers" ON public.sellers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_acts"    ON public.acts    FOR ALL USING (true) WITH CHECK (true);

-- 5. API წვდომა anon / authenticated როლებისთვის (Supabase JS)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users   TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sellers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acts    TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 6. სატესტო მონაცემები (მხოლოდ ცარიელი ცხრილებისას)
INSERT INTO public.users (name, pid)
SELECT * FROM (VALUES
  ('გიორგი ბერიძე',   '61006015436'),
  ('ნინო გელაშვილი',  '61006015437')
) AS v(name, pid)
WHERE NOT EXISTS (SELECT 1 FROM public.users LIMIT 1);

INSERT INTO public.sellers (name, pid)
SELECT * FROM (VALUES
  ('ლევან ხვედელიძე',     '61004046896'),
  ('მარინე სულხანიშვილი', '62001234567')
) AS v(name, pid)
WHERE NOT EXISTS (SELECT 1 FROM public.sellers LIMIT 1);
