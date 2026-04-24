-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT DEFAULT 'circle',
  color TEXT DEFAULT '#9AB17A',
  is_global BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT user_category_check CHECK (
    is_global = TRUE AND user_id IS NULL OR
    is_global = FALSE AND user_id IS NOT NULL
  )
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view global and own categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (is_global = TRUE OR (SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id AND is_global = FALSE);

CREATE POLICY "Users can update own categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id AND is_global = FALSE);

CREATE POLICY "Users can delete own categories"
  ON public.categories FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id AND is_global = FALSE);

CREATE POLICY "Admins can manage global categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Seed global categories (Indonesian)
INSERT INTO public.categories (name, type, icon, color, is_global, sort_order) VALUES
  ('Gaji', 'income', 'briefcase', '#9AB17A', TRUE, 1),
  ('Freelance', 'income', 'laptop', '#7CA85A', TRUE, 2),
  ('Investasi', 'income', 'trending-up', '#5D9940', TRUE, 3),
  ('Hadiah', 'income', 'gift', '#B8D49A', TRUE, 4),
  ('Lainnya', 'income', 'circle', '#C3CC9B', TRUE, 99),
  ('Makanan', 'expense', 'utensils', '#E07A5F', TRUE, 10),
  ('Transportasi', 'expense', 'car', '#3D405B', TRUE, 11),
  ('Tempat Tinggal', 'expense', 'home', '#81B29A', TRUE, 12),
  ('Utilitas', 'expense', 'zap', '#F2CC8F', TRUE, 13),
  ('Kesehatan', 'expense', 'heart', '#E07A5F', TRUE, 14),
  ('Hiburan', 'expense', 'film', '#9B5DE5', TRUE, 15),
  ('Pendidikan', 'expense', 'graduation-cap', '#00BBF9', TRUE, 16),
  ('Belanja', 'expense', 'shopping-bag', '#F15BB5', TRUE, 17),
  ('Tabungan', 'expense', 'piggy-bank', '#00BBF9', TRUE, 18),
  ('Lainnya', 'expense', 'circle', '#6B6B6B', TRUE, 99);
