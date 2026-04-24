-- Balance trigger: adjust account balance on income/expense update
CREATE OR REPLACE FUNCTION public.update_account_balance_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Reverse old effect
  IF OLD.type = 'income' THEN
    UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
  ELSIF OLD.type = 'expense' THEN
    UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
  END IF;

  -- Apply new effect
  IF NEW.type = 'income' THEN
    UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
  ELSIF NEW.type = 'expense' THEN
    UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_balance_on_update ON public.transactions;

CREATE TRIGGER trigger_update_balance_on_update
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  WHEN (
    (OLD.type IN ('income', 'expense') OR NEW.type IN ('income', 'expense'))
    AND (
      OLD.amount IS DISTINCT FROM NEW.amount
      OR OLD.type IS DISTINCT FROM NEW.type
      OR OLD.account_id IS DISTINCT FROM NEW.account_id
    )
  )
  EXECUTE FUNCTION public.update_account_balance_on_update();

