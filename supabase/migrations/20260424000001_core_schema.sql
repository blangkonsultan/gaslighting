-- ==============================================================================
-- 1. PROFILES TABLE & TRIGGERS
-- ==============================================================================

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  default_currency TEXT NOT NULL DEFAULT 'IDR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Shared updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Prevent privilege escalation: users cannot change their own role
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Role changes are not allowed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_prevent_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();

-- Profile RLS Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- ==============================================================================
-- 2. CATEGORIES TABLE & SEED DATA
-- ==============================================================================

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

-- Seed global categories
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
  ('Lainnya', 'expense', 'circle', '#6B6B6B', TRUE, 99)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 3. ACCOUNTS TABLE
-- ==============================================================================

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank', 'ewallet', 'cash', 'savings', 'investment', 'other')),
  balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
  initial_balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'IDR',
  icon TEXT DEFAULT 'wallet',
  color TEXT DEFAULT '#9AB17A',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Users can view own accounts"
  ON public.accounts FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own accounts"
  ON public.accounts FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own accounts"
  ON public.accounts FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own accounts"
  ON public.accounts FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ==============================================================================
-- 4. BILLS TABLE (EXPENSE-ONLY)
-- ==============================================================================

CREATE TABLE public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type = 'expense'),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER bills_updated_at
  BEFORE UPDATE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Users can view own bills"
  ON public.bills FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own bills"
  ON public.bills FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own bills"
  ON public.bills FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own bills"
  ON public.bills FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ==============================================================================
-- 5. TRANSACTIONS TABLE & BALANCE TRIGGERS
-- ==============================================================================

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount NUMERIC(18, 2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transfer_id UUID,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Balance trigger: update account balance on income/expense insert
CREATE OR REPLACE FUNCTION public.update_account_balance_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.type = 'income' THEN
    UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
  ELSIF NEW.type = 'expense' THEN
    UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_balance_on_insert
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  WHEN (NEW.type IN ('income', 'expense'))
  EXECUTE FUNCTION public.update_account_balance_on_insert();

-- Balance trigger: reverse balance on transaction delete
CREATE OR REPLACE FUNCTION public.reverse_account_balance_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.type = 'income' THEN
    UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
  ELSIF OLD.type = 'expense' THEN
    UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trigger_reverse_balance_on_delete
  AFTER DELETE ON public.transactions
  FOR EACH ROW
  WHEN (OLD.type IN ('income', 'expense'))
  EXECUTE FUNCTION public.reverse_account_balance_on_delete();
