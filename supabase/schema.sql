-- ============================================================
-- TaskFlow — Supabase SQL Schema
-- Supabase SQL Editor'a yapıştırıp çalıştır
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── PROFILES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username    TEXT UNIQUE NOT NULL,
  full_name   TEXT,
  role        TEXT CHECK (role IN ('intern','junior','mid','senior','lead')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── BOARDS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.boards (
  id                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title                    TEXT NOT NULL,
  description              TEXT,
  owner_id                 UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_public                BOOLEAN DEFAULT FALSE,
  share_token              TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  default_link_permission  TEXT DEFAULT 'viewer' CHECK (default_link_permission IN ('viewer','editor')),
  background_color         TEXT DEFAULT '#172031',
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ── BOARD MEMBERS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.board_members (
  board_id    UUID REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission  TEXT NOT NULL CHECK (permission IN ('viewer','editor','admin')),
  invited_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (board_id, user_id)
);

-- ── COLUMNS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.columns (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id   UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  title      TEXT NOT NULL,
  order_key  TEXT NOT NULL,
  color      TEXT DEFAULT '#253550',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CARDS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cards (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  column_id      UUID REFERENCES public.columns(id) ON DELETE CASCADE NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  order_key      TEXT NOT NULL,
  due_date       TIMESTAMPTZ,
  assignee_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  labels         TEXT[] DEFAULT '{}',
  last_edited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_edited_at TIMESTAMPTZ DEFAULT NOW(),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_boards_owner       ON public.boards(owner_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user ON public.board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_columns_board      ON public.columns(board_id, order_key);
CREATE INDEX IF NOT EXISTS idx_cards_column       ON public.cards(column_id, order_key);
CREATE INDEX IF NOT EXISTS idx_cards_assignee     ON public.cards(assignee_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username  ON public.profiles(username);

-- ── AUTO-UPDATE updated_at ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_boards_updated_at
  BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── AUTO-CREATE PROFILE ON SIGNUP ────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  raw_username TEXT;
  final_username TEXT;
  counter INT := 0;
BEGIN
  raw_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  -- Sanitize: lowercase, remove non-alphanumeric except _ and -
  raw_username := lower(regexp_replace(raw_username, '[^a-zA-Z0-9_-]', '', 'g'));
  IF length(raw_username) < 3 THEN raw_username := raw_username || '_user'; END IF;

  final_username := raw_username;
  -- Handle username collisions
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := raw_username || counter::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards         ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "profiles_select_all"   ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own"   ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own"   ON public.profiles FOR DELETE USING (auth.uid() = id);

-- SECURITY DEFINER helpers — bypass RLS to prevent board_members ↔ boards recursion
CREATE OR REPLACE FUNCTION public.get_my_board_ids()
RETURNS SETOF UUID LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT board_id FROM public.board_members WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_my_admin_board_ids()
RETURNS SETOF UUID LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT board_id FROM public.board_members WHERE user_id = auth.uid() AND permission = 'admin'
$$;

-- BOARDS policies
CREATE POLICY "boards_select" ON public.boards FOR SELECT USING (
  owner_id = auth.uid()
  OR id IN (SELECT public.get_my_board_ids())
  OR is_public = TRUE
);
CREATE POLICY "boards_insert" ON public.boards FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "boards_update" ON public.boards FOR UPDATE USING (
  owner_id = auth.uid()
  OR id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid() AND permission IN ('editor','admin'))
);
CREATE POLICY "boards_delete" ON public.boards FOR DELETE USING (owner_id = auth.uid());

-- BOARD_MEMBERS policies
CREATE POLICY "members_select" ON public.board_members FOR SELECT USING (
  user_id = auth.uid()
  OR board_id IN (SELECT id FROM public.boards WHERE owner_id = auth.uid())
);
CREATE POLICY "members_insert" ON public.board_members FOR INSERT WITH CHECK (
  board_id IN (SELECT id FROM public.boards WHERE owner_id = auth.uid())
  OR board_id IN (SELECT public.get_my_admin_board_ids())
);
CREATE POLICY "members_update" ON public.board_members FOR UPDATE USING (
  board_id IN (SELECT id FROM public.boards WHERE owner_id = auth.uid())
  OR board_id IN (SELECT public.get_my_admin_board_ids())
);
CREATE POLICY "members_delete" ON public.board_members FOR DELETE USING (
  user_id = auth.uid()
  OR board_id IN (SELECT id FROM public.boards WHERE owner_id = auth.uid())
  OR board_id IN (SELECT public.get_my_admin_board_ids())
);

-- COLUMNS policies
CREATE POLICY "columns_select" ON public.columns FOR SELECT USING (
  board_id IN (SELECT id FROM public.boards)
);
CREATE POLICY "columns_insert" ON public.columns FOR INSERT WITH CHECK (
  board_id IN (SELECT id FROM public.boards WHERE owner_id = auth.uid())
  OR board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid() AND permission IN ('editor','admin'))
);
CREATE POLICY "columns_update" ON public.columns FOR UPDATE USING (
  board_id IN (SELECT id FROM public.boards WHERE owner_id = auth.uid())
  OR board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid() AND permission IN ('editor','admin'))
);
CREATE POLICY "columns_delete" ON public.columns FOR DELETE USING (
  board_id IN (SELECT id FROM public.boards WHERE owner_id = auth.uid())
  OR board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid() AND permission IN ('editor','admin'))
);

-- CARDS policies
CREATE POLICY "cards_select" ON public.cards FOR SELECT USING (
  column_id IN (SELECT id FROM public.columns)
);
CREATE POLICY "cards_insert" ON public.cards FOR INSERT WITH CHECK (
  column_id IN (
    SELECT c.id FROM public.columns c
    JOIN public.boards b ON b.id = c.board_id
    WHERE b.owner_id = auth.uid()
    OR c.board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid() AND permission IN ('editor','admin'))
  )
);
CREATE POLICY "cards_update" ON public.cards FOR UPDATE USING (
  column_id IN (
    SELECT c.id FROM public.columns c
    JOIN public.boards b ON b.id = c.board_id
    WHERE b.owner_id = auth.uid()
    OR c.board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid() AND permission IN ('editor','admin'))
  )
);
CREATE POLICY "cards_delete" ON public.cards FOR DELETE USING (
  column_id IN (
    SELECT c.id FROM public.columns c
    JOIN public.boards b ON b.id = c.board_id
    WHERE b.owner_id = auth.uid()
    OR c.board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid() AND permission IN ('editor','admin'))
  )
);

-- ── REALTIME ─────────────────────────────────────────────────
-- Supabase Dashboard > Realtime > Tables'dan şu tabloları enable et:
--   boards, columns, cards, board_members
-- Veya aşağıdaki komutları çalıştır:
ALTER PUBLICATION supabase_realtime ADD TABLE public.cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.columns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_members;

-- ── DONE ─────────────────────────────────────────────────────
-- Schema başarıyla oluşturuldu!
-- Sonraki adım: .env.local dosyasına Supabase URL ve ANON KEY'i ekle
