-- =============================================================================
-- TITIK. — Migration 20261028000004: Disable Email Confirmation for Instant Signup
-- Description: Automatically confirms all existing unconfirmed accounts in auth.users
--              and sets up an auth trigger so any future user signups are immediately
--              confirmed without requiring email verification.
-- =============================================================================

-- 1. Auto-confirm all existing unconfirmed accounts in auth.users
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 2. Trigger function to auto-confirm new users immediately at database level
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS trigger AS $$
BEGIN
  -- Automatically confirm email upon creation so users can log in immediately
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 3. Register trigger BEFORE INSERT on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_new_user();

-- 4. Register trigger BEFORE UPDATE on auth.users (if email was changed or set)
DROP TRIGGER IF EXISTS on_auth_user_updated_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_updated_auto_confirm
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_new_user();
