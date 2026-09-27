-- ==============================================================================
-- TRANSACTION TEMPLATES MIGRATION
-- Reusable templates for fast transaction entry
-- ==============================================================================

CREATE TABLE public.transaction_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount NUMERIC(18, 2),
  description TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_template_name_per_user UNIQUE (user_id, name)
);

-- Indexes
CREATE INDEX idx_transaction_templates_user_sort ON public.transaction_templates (user_id, sort_order ASC, created_at DESC);
CREATE INDEX idx_transaction_templates_account ON public.transaction_templates (account_id);
CREATE INDEX idx_transaction_templates_category ON public.transaction_templates (category_id);

-- Updated_at trigger
CREATE TRIGGER transaction_templates_updated_at
  BEFORE UPDATE ON public.transaction_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.transaction_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transaction templates"
  ON public.transaction_templates FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own transaction templates"
  ON public.transaction_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id AND
    (
      account_id IS NULL OR
      EXISTS (
        SELECT 1 FROM public.accounts
        WHERE id = account_id AND user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "Users can update own transaction templates"
  ON public.transaction_templates FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id AND
    (
      account_id IS NULL OR
      EXISTS (
        SELECT 1 FROM public.accounts
        WHERE id = account_id AND user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "Users can delete own transaction templates"
  ON public.transaction_templates FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
