-- Atomic transfer function
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
