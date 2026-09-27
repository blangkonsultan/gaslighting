-- ==============================================================================
-- SECURITY HARDENING MIGRATION
-- 1. Prevent direct account balance updates via column-level permissions & trigger
-- 2. Prevent cross-account IDOR in transactions and bills RLS
-- 3. Strict positive amount validation in execute_transfer RPC
-- ==============================================================================

-- 1. PREVENT DIRECT BALANCE MUTATION ON ACCOUNTS
-- Restrict column update privileges for authenticated users
REVOKE UPDATE ON public.accounts FROM authenticated;
GRANT UPDATE (name, type, icon, color, is_active, notes) ON public.accounts TO authenticated;

-- Defense-in-depth trigger: reject balance mutation from authenticated direct calls
CREATE OR REPLACE FUNCTION public.prevent_direct_account_balance_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.balance IS DISTINCT FROM OLD.balance THEN
    -- If executed by authenticated role directly (outside security definer RPCs where role is postgres)
    IF (SELECT auth.role()) = 'authenticated' AND current_user = 'authenticated' THEN
      RAISE EXCEPTION 'Direct balance updates are not permitted. Use transactions or transfers.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_direct_balance_update ON public.accounts;
CREATE TRIGGER trigger_prevent_direct_balance_update
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_direct_account_balance_update();

-- 2. PREVENT CROSS-ACCOUNT IDOR IN TRANSACTIONS RLS
DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;
CREATE POLICY "Users can create own transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id AND
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE id = account_id AND user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id AND
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE id = account_id AND user_id = (SELECT auth.uid())
    )
  );

-- 3. PREVENT CROSS-ACCOUNT IDOR IN BILLS RLS
DROP POLICY IF EXISTS "Users can create own bills" ON public.bills;
CREATE POLICY "Users can create own bills"
  ON public.bills FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id AND
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE id = account_id AND user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own bills" ON public.bills;
CREATE POLICY "Users can update own bills"
  ON public.bills FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id AND
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE id = account_id AND user_id = (SELECT auth.uid())
    )
  );

-- 4. STRICT AMOUNT GUARD IN EXECUTE_TRANSFER RPC
CREATE OR REPLACE FUNCTION public.execute_transfer(
  p_user_id UUID,
  p_from_account_id UUID,
  p_to_account_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT '',
  p_transaction_date DATE DEFAULT CURRENT_DATE,
  p_category_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_transfer_id UUID := gen_random_uuid();
  v_from_balance NUMERIC;
  v_to_balance NUMERIC;
BEGIN
  -- Authorization guard (prevent IDOR)
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Validate amount is positive
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero';
  END IF;

  IF p_from_account_id = p_to_account_id THEN
    RAISE EXCEPTION 'Cannot transfer to the same account';
  END IF;

  SELECT balance INTO v_from_balance
  FROM public.accounts
  WHERE id = p_from_account_id AND user_id = p_user_id
  FOR UPDATE;

  IF v_from_balance IS NULL THEN
    RAISE EXCEPTION 'Source account not found';
  END IF;

  IF v_from_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  SELECT balance INTO v_to_balance
  FROM public.accounts
  WHERE id = p_to_account_id AND user_id = p_user_id
  FOR UPDATE;

  IF v_to_balance IS NULL THEN
    RAISE EXCEPTION 'Destination account not found';
  END IF;

  UPDATE public.accounts SET balance = balance - p_amount WHERE id = p_from_account_id;
  UPDATE public.accounts SET balance = balance + p_amount WHERE id = p_to_account_id;

  INSERT INTO public.transactions (user_id, account_id, category_id, type, amount, description, transaction_date, transfer_id)
  VALUES (p_user_id, p_from_account_id, p_category_id, 'transfer', p_amount,
    'Transfer keluar: ' || COALESCE(p_description, ''), p_transaction_date, v_transfer_id);

  INSERT INTO public.transactions (user_id, account_id, category_id, type, amount, description, transaction_date, transfer_id)
  VALUES (p_user_id, p_to_account_id, p_category_id, 'transfer', p_amount,
    'Transfer masuk: ' || COALESCE(p_description, ''), p_transaction_date, v_transfer_id);

  RETURN v_transfer_id;
END;
$$;
