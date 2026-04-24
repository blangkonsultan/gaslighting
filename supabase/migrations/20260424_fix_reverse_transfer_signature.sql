-- Fix reverse_transfer RPC signature for PostgREST
-- Postgres identifies function signatures by argument types only, so we cannot have two
-- reverse_transfer(uuid, uuid) variants with different argument order/names.
-- We rename the implementation to reverse_transfer_impl(user_id, transfer_id),
-- then expose reverse_transfer(transfer_id, user_id) as a wrapper.

DROP FUNCTION IF EXISTS public.reverse_transfer(UUID, UUID);

CREATE OR REPLACE FUNCTION public.reverse_transfer_impl(
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

CREATE OR REPLACE FUNCTION public.reverse_transfer(
  p_transfer_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.reverse_transfer_impl(p_user_id, p_transfer_id);
END;
$$;

