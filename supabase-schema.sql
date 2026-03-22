-- ============================================================
-- შესყიდვის აქტი — Supabase Database Schema
-- გაუშვით Supabase SQL Editor-ში
-- ============================================================

-- 1. მომხმარებლების ცხრილი
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

-- 4. Row Level Security — Public წვდომა (anon key)
ALTER TABLE public.users   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acts    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_users"   ON public.users   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_sellers" ON public.sellers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_acts"    ON public.acts    FOR ALL USING (true) WITH CHECK (true);

-- 5. სატესტო მონაცემები
INSERT INTO public.users (name, pid) VALUES
  ('გიორგი ბერიძე',   '61006015436'),
  ('ნინო გელაშვილი',  '61006015437');

INSERT INTO public.sellers (name, pid) VALUES
  ('ლევან ხვედელიძე',     '61004046896'),
  ('მარინე სულხანიშვილი', '62001234567');
