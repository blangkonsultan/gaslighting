-- ==============================================================================
-- PROMOTE ADMIN USER
-- ==============================================================================

-- Temporarily disable the application-level prevent_role_change trigger
-- to allow authorized migration-based role assignment.
ALTER TABLE public.profiles DISABLE TRIGGER profiles_prevent_role_change;

UPDATE public.profiles
SET role = 'admin',
    onboarding_completed = TRUE,
    updated_at = now()
WHERE email = 'adheraprabubagaskhara@gmail.com';

ALTER TABLE public.profiles ENABLE TRIGGER profiles_prevent_role_change;
