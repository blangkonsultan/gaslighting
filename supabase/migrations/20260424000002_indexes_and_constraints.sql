-- ==============================================================================
-- 1. PERFORMANCE INDEXES (16 INDEXES)
-- ==============================================================================

CREATE INDEX idx_profiles_email ON public.profiles (email);
CREATE INDEX idx_accounts_user_id ON public.accounts (user_id);
CREATE INDEX idx_accounts_user_active ON public.accounts (user_id, is_active);
CREATE INDEX idx_transactions_user_id ON public.transactions (user_id);
CREATE INDEX idx_transactions_account_id ON public.transactions (account_id);
CREATE INDEX idx_transactions_category_id ON public.transactions (category_id);
CREATE INDEX idx_transactions_date ON public.transactions (transaction_date DESC);
CREATE INDEX idx_transactions_user_date ON public.transactions (user_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_type ON public.transactions (user_id, type);
CREATE INDEX idx_transactions_transfer_id ON public.transactions (transfer_id) WHERE transfer_id IS NOT NULL;
CREATE INDEX idx_transactions_bill_id ON public.transactions (bill_id) WHERE bill_id IS NOT NULL;
CREATE INDEX idx_categories_user_id ON public.categories (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_categories_global ON public.categories (is_global) WHERE is_global = TRUE;
CREATE INDEX idx_bills_user_id ON public.bills (user_id);
CREATE INDEX idx_bills_next_date ON public.bills (next_date) WHERE is_active = TRUE;
CREATE INDEX idx_bills_user_active ON public.bills (user_id, is_active);

-- ==============================================================================
-- 2. NON-NEGATIVE ACCOUNT BALANCE CONSTRAINT
-- ==============================================================================

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_balance_non_negative CHECK (balance >= 0);

-- ==============================================================================
-- 3. SUFFICIENT BALANCE ENFORCEMENT ON EXPENSE WRITES
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.assert_sufficient_balance_for_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_old_balance NUMERIC;
  v_new_balance NUMERIC;
  v_balance_after_old NUMERIC;
  v_balance_after_new NUMERIC;
  v_reversal_old NUMERIC := 0;
  v_apply_new NUMERIC := 0;
BEGIN
  -- Prevent negative balances caused by expense writes.
  IF TG_OP = 'INSERT' THEN
    IF NEW.type <> 'expense' THEN
      RETURN NEW;
    END IF;

    SELECT balance INTO v_new_balance
    FROM public.accounts
    WHERE id = NEW.account_id AND user_id = NEW.user_id
    FOR UPDATE;

    IF v_new_balance IS NULL THEN
      RAISE EXCEPTION 'Account not found';
    END IF;

    IF v_new_balance < NEW.amount THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;

    RETURN NEW;
  END IF;

  -- UPDATE: ensure the final balance(s) won't go below 0 after reversing OLD and applying NEW.
  IF TG_OP = 'UPDATE' THEN
    IF NEW.type <> 'expense' AND OLD.type <> 'expense' THEN
      RETURN NEW;
    END IF;

    v_reversal_old := CASE
      WHEN OLD.type = 'expense' THEN OLD.amount
      WHEN OLD.type = 'income' THEN -OLD.amount
      ELSE 0
    END;

    v_apply_new := CASE
      WHEN NEW.type = 'expense' THEN -NEW.amount
      WHEN NEW.type = 'income' THEN NEW.amount
      ELSE 0
    END;

    IF OLD.account_id = NEW.account_id THEN
      SELECT balance INTO v_old_balance
      FROM public.accounts
      WHERE id = OLD.account_id AND user_id = NEW.user_id
      FOR UPDATE;

      IF v_old_balance IS NULL THEN
        RAISE EXCEPTION 'Account not found';
      END IF;

      v_balance_after_old := v_old_balance + v_reversal_old + v_apply_new;
      IF v_balance_after_old < 0 THEN
        RAISE EXCEPTION 'Insufficient balance';
      END IF;

      RETURN NEW;
    END IF;

    -- Account changed: lock both accounts deterministically.
    SELECT balance INTO v_old_balance
    FROM public.accounts
    WHERE id = LEAST(OLD.account_id, NEW.account_id) AND user_id = NEW.user_id
    FOR UPDATE;

    SELECT balance INTO v_new_balance
    FROM public.accounts
    WHERE id = GREATEST(OLD.account_id, NEW.account_id) AND user_id = NEW.user_id
    FOR UPDATE;

    -- Re-read with exact ids
    SELECT balance INTO v_old_balance
    FROM public.accounts
    WHERE id = OLD.account_id AND user_id = NEW.user_id;

    SELECT balance INTO v_new_balance
    FROM public.accounts
    WHERE id = NEW.account_id AND user_id = NEW.user_id;

    IF v_old_balance IS NULL OR v_new_balance IS NULL THEN
      RAISE EXCEPTION 'Account not found';
    END IF;

    v_balance_after_old := v_old_balance + v_reversal_old;
    v_balance_after_new := v_new_balance + v_apply_new;

    IF v_balance_after_old < 0 OR v_balance_after_new < 0 THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_assert_sufficient_balance_for_tx ON public.transactions;

CREATE TRIGGER trigger_assert_sufficient_balance_for_tx
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.assert_sufficient_balance_for_transaction();
