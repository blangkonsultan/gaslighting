-- Enforce: bills/auto-debit are expense-only.
-- This prevents creating income "auto-debits" via UI or direct API calls.

ALTER TABLE public.bills
  DROP CONSTRAINT IF EXISTS bills_type_check;

ALTER TABLE public.bills
  ADD CONSTRAINT bills_type_check CHECK (type = 'expense');

