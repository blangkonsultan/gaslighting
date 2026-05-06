-- Fix: jsonb_set requires path as text[], not text (runtime error 42883 on preview RPC).

CREATE OR REPLACE FUNCTION public.get_balance_recalculation_preview(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB := jsonb_build_object();
  v_account RECORD;
  v_income_sum NUMERIC;
  v_expense_sum NUMERIC;
  v_transfer_in_sum NUMERIC;
  v_transfer_out_sum NUMERIC;
  v_calculated_balance NUMERIC;
BEGIN
  FOR v_account IN
    SELECT id, name, balance, initial_balance
    FROM public.accounts
    WHERE user_id = p_user_id AND is_active = TRUE
    ORDER BY created_at ASC
  LOOP
    SELECT COALESCE(SUM(amount), 0) INTO v_income_sum
    FROM public.transactions
    WHERE account_id = v_account.id AND type = 'income';

    SELECT COALESCE(SUM(amount), 0) INTO v_expense_sum
    FROM public.transactions
    WHERE account_id = v_account.id AND type = 'expense';

    SELECT COALESCE(SUM(amount), 0) INTO v_transfer_in_sum
    FROM public.transactions
    WHERE account_id = v_account.id
      AND type = 'transfer'
      AND COALESCE(description, '') ILIKE '%transfer masuk%';

    SELECT COALESCE(SUM(amount), 0) INTO v_transfer_out_sum
    FROM public.transactions
    WHERE account_id = v_account.id
      AND type = 'transfer'
      AND COALESCE(description, '') ILIKE '%transfer keluar%';

    v_calculated_balance := v_account.initial_balance + v_income_sum - v_expense_sum + v_transfer_in_sum - v_transfer_out_sum;

    v_result := jsonb_set(
      v_result,
      ARRAY[v_account.id::text],
      jsonb_build_object(
        'accountId', v_account.id,
        'accountName', v_account.name,
        'currentBalance', v_account.balance,
        'calculatedBalance', v_calculated_balance,
        'needsUpdate', v_account.balance IS DISTINCT FROM v_calculated_balance,
        'wouldBeNegative', v_calculated_balance < 0
      )
    );
  END LOOP;

  RETURN v_result::JSON;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_account_balances(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB := jsonb_build_object('updated', jsonb_build_object(), 'skipped', jsonb_build_object());
  v_account RECORD;
  v_income_sum NUMERIC;
  v_expense_sum NUMERIC;
  v_transfer_in_sum NUMERIC;
  v_transfer_out_sum NUMERIC;
  v_calculated_balance NUMERIC;
BEGIN
  FOR v_account IN
    SELECT id, name, balance, initial_balance
    FROM public.accounts
    WHERE user_id = p_user_id AND is_active = TRUE
    ORDER BY created_at ASC
  LOOP
    SELECT COALESCE(SUM(amount), 0) INTO v_income_sum
    FROM public.transactions
    WHERE account_id = v_account.id AND type = 'income';

    SELECT COALESCE(SUM(amount), 0) INTO v_expense_sum
    FROM public.transactions
    WHERE account_id = v_account.id AND type = 'expense';

    SELECT COALESCE(SUM(amount), 0) INTO v_transfer_in_sum
    FROM public.transactions
    WHERE account_id = v_account.id
      AND type = 'transfer'
      AND COALESCE(description, '') ILIKE '%transfer masuk%';

    SELECT COALESCE(SUM(amount), 0) INTO v_transfer_out_sum
    FROM public.transactions
    WHERE account_id = v_account.id
      AND type = 'transfer'
      AND COALESCE(description, '') ILIKE '%transfer keluar%';

    v_calculated_balance := v_account.initial_balance + v_income_sum - v_expense_sum + v_transfer_in_sum - v_transfer_out_sum;

    IF v_calculated_balance < 0 THEN
      v_result := jsonb_set(
        v_result,
        ARRAY['skipped', v_account.id::text],
        jsonb_build_object(
          'accountId', v_account.id,
          'accountName', v_account.name,
          'currentBalance', v_account.balance,
          'calculatedBalance', v_calculated_balance,
          'skipReason', 'negative_balance'
        )
      );
    ELSIF v_account.balance IS DISTINCT FROM v_calculated_balance THEN
      UPDATE public.accounts
      SET balance = v_calculated_balance, updated_at = NOW()
      WHERE id = v_account.id;

      v_result := jsonb_set(
        v_result,
        ARRAY['updated', v_account.id::text],
        jsonb_build_object(
          'accountId', v_account.id,
          'accountName', v_account.name,
          'currentBalance', v_account.balance,
          'calculatedBalance', v_calculated_balance
        )
      );
    END IF;
  END LOOP;

  RETURN v_result::JSON;
END;
$$;
