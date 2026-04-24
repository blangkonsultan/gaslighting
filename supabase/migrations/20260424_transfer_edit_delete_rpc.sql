-- Transfer update & delete (reverse) RPCs
-- These functions keep balances consistent by updating/deleting BOTH transfer rows atomically.

CREATE OR REPLACE FUNCTION public.reverse_transfer(
  p_user_id UUID,
  p_transfer_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_out_tx_id UUID;
  v_in_tx_id UUID;
  v_from_account_id UUID;
  v_to_account_id UUID;
  v_amount NUMERIC;
  v_to_balance NUMERIC;
BEGIN
  -- Find the two transfer rows.
  SELECT id, account_id, amount
    INTO v_out_tx_id, v_from_account_id, v_amount
  FROM public.transactions
  WHERE user_id = p_user_id
    AND transfer_id = p_transfer_id
    AND type = 'transfer'
    AND COALESCE(description, '') ILIKE 'Transfer keluar:%'
  LIMIT 1;

  SELECT id, account_id
    INTO v_in_tx_id, v_to_account_id
  FROM public.transactions
  WHERE user_id = p_user_id
    AND transfer_id = p_transfer_id
    AND type = 'transfer'
    AND COALESCE(description, '') ILIKE 'Transfer masuk:%'
  LIMIT 1;

  IF v_out_tx_id IS NULL OR v_in_tx_id IS NULL THEN
    RAISE EXCEPTION 'Transfer not found';
  END IF;

  -- Lock destination balance and validate it can be reversed.
  SELECT balance INTO v_to_balance
  FROM public.accounts
  WHERE id = v_to_account_id AND user_id = p_user_id
  FOR UPDATE;

  IF v_to_balance IS NULL THEN
    RAISE EXCEPTION 'Destination account not found';
  END IF;

  IF v_to_balance < v_amount THEN
    RAISE EXCEPTION 'Insufficient balance to reverse';
  END IF;

  -- Lock source account too (deterministic order) then apply reversal.
  PERFORM 1
  FROM public.accounts
  WHERE id = LEAST(v_from_account_id, v_to_account_id) AND user_id = p_user_id
  FOR UPDATE;

  PERFORM 1
  FROM public.accounts
  WHERE id = GREATEST(v_from_account_id, v_to_account_id) AND user_id = p_user_id
  FOR UPDATE;

  UPDATE public.accounts SET balance = balance + v_amount WHERE id = v_from_account_id;
  UPDATE public.accounts SET balance = balance - v_amount WHERE id = v_to_account_id;

  DELETE FROM public.transactions
  WHERE user_id = p_user_id
    AND transfer_id = p_transfer_id
    AND type = 'transfer';
END;
$$;

CREATE OR REPLACE FUNCTION public.update_transfer(
  p_user_id UUID,
  p_transfer_id UUID,
  p_from_account_id UUID,
  p_to_account_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT '',
  p_transaction_date DATE DEFAULT CURRENT_DATE,
  p_category_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_out_tx_id UUID;
  v_in_tx_id UUID;
  v_old_from_account_id UUID;
  v_old_to_account_id UUID;
  v_old_amount NUMERIC;
  v_old_to_balance NUMERIC;
  v_new_from_balance NUMERIC;
BEGIN
  IF p_from_account_id = p_to_account_id THEN
    RAISE EXCEPTION 'Cannot transfer to the same account';
  END IF;

  -- Fetch existing transfer rows.
  SELECT id, account_id, amount
    INTO v_out_tx_id, v_old_from_account_id, v_old_amount
  FROM public.transactions
  WHERE user_id = p_user_id
    AND transfer_id = p_transfer_id
    AND type = 'transfer'
    AND COALESCE(description, '') ILIKE 'Transfer keluar:%'
  LIMIT 1;

  SELECT id, account_id
    INTO v_in_tx_id, v_old_to_account_id
  FROM public.transactions
  WHERE user_id = p_user_id
    AND transfer_id = p_transfer_id
    AND type = 'transfer'
    AND COALESCE(description, '') ILIKE 'Transfer masuk:%'
  LIMIT 1;

  IF v_out_tx_id IS NULL OR v_in_tx_id IS NULL THEN
    RAISE EXCEPTION 'Transfer not found';
  END IF;

  -- Lock all involved accounts deterministically to avoid deadlocks.
  PERFORM 1
  FROM public.accounts
  WHERE user_id = p_user_id
    AND id IN (v_old_from_account_id, v_old_to_account_id, p_from_account_id, p_to_account_id)
  ORDER BY id
  FOR UPDATE;

  -- Validate reversal is possible from old destination.
  SELECT balance INTO v_old_to_balance
  FROM public.accounts
  WHERE id = v_old_to_account_id AND user_id = p_user_id;

  IF v_old_to_balance IS NULL THEN
    RAISE EXCEPTION 'Destination account not found';
  END IF;

  IF v_old_to_balance < v_old_amount THEN
    RAISE EXCEPTION 'Insufficient balance to reverse';
  END IF;

  -- Reverse old transfer effect.
  UPDATE public.accounts SET balance = balance + v_old_amount WHERE id = v_old_from_account_id;
  UPDATE public.accounts SET balance = balance - v_old_amount WHERE id = v_old_to_account_id;

  -- Validate new transfer can be applied.
  SELECT balance INTO v_new_from_balance
  FROM public.accounts
  WHERE id = p_from_account_id AND user_id = p_user_id;

  IF v_new_from_balance IS NULL THEN
    RAISE EXCEPTION 'Source account not found';
  END IF;

  IF v_new_from_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Apply new transfer effect.
  UPDATE public.accounts SET balance = balance - p_amount WHERE id = p_from_account_id;
  UPDATE public.accounts SET balance = balance + p_amount WHERE id = p_to_account_id;

  -- Update both transfer rows.
  UPDATE public.transactions
  SET account_id = p_from_account_id,
      category_id = p_category_id,
      amount = p_amount,
      description = 'Transfer keluar: ' || COALESCE(p_description, ''),
      transaction_date = p_transaction_date
  WHERE id = v_out_tx_id AND user_id = p_user_id;

  UPDATE public.transactions
  SET account_id = p_to_account_id,
      category_id = p_category_id,
      amount = p_amount,
      description = 'Transfer masuk: ' || COALESCE(p_description, ''),
      transaction_date = p_transaction_date
  WHERE id = v_in_tx_id AND user_id = p_user_id;
END;
$$;

