-- Performance indexes
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
