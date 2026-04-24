-- PostgREST RPC lookup is sensitive to argument order.
-- Provide a wrapper matching (p_transfer_id, p_user_id) order.

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
  -- Call the canonical implementation (defined with p_user_id first).
  PERFORM public.reverse_transfer(p_user_id, p_transfer_id);
END;
$$;

