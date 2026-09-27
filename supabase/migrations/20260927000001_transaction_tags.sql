-- ==============================================================================
-- TRANSACTION TAGS
-- ==============================================================================

-- Add tags column to transactions table (defaulting to empty array)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- Create GIN index for fast array containment queries (e.g. tags @> ARRAY['#liburan'])
CREATE INDEX IF NOT EXISTS idx_transactions_tags ON public.transactions USING GIN (tags);
