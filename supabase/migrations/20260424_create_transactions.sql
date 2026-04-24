-- Transactions table
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
  bill_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies
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
