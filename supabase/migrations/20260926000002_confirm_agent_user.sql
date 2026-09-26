-- ==============================================================================
-- CONFIRM AGENT TEST USER
-- ==============================================================================

-- Confirm email in auth.users for agent@gaslighting.com
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email = 'agent@gaslighting.com';
