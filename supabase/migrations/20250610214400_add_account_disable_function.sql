-- Create a function to disable a user account
-- This doesn't actually delete the user from auth.users but marks them as inactive
-- and anonymizes their data for privacy while preserving referential integrity
CREATE OR REPLACE FUNCTION public.disable_user_account(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  anonymized_email TEXT;
  anonymized_username TEXT;
BEGIN
  -- Generate anonymized values
  anonymized_email := 'deleted_' || encode(gen_random_bytes(8), 'hex') || '@deleted.user';
  anonymized_username := 'deleted_user_' || encode(gen_random_bytes(6), 'hex');

  -- Update profiles table
  UPDATE public.profiles
  SET 
    full_name = 'Deleted User',
    username = anonymized_username,
    avatar_url = NULL,
    bio = NULL,
    website = NULL,
    social_links = '{}'::jsonb,
    is_active = FALSE,
    updated_at = NOW()
  WHERE id = user_id;

  -- Update user_credits to zero out credits
  UPDATE public.user_credits
  SET
    monthly_credits = 0,
    purchased_credits = 0,
    credits_used = 0,
    updated_at = NOW()
  WHERE user_id = user_id;

  -- Cancel any active subscriptions
  UPDATE public.user_subscriptions
  SET
    status = 'canceled',
    cancel_at_period_end = TRUE,
    updated_at = NOW()
  WHERE user_id = user_id AND status = 'active';

  -- Anonymize user in auth.users table
  -- Note: This requires superuser privileges or appropriate policies
  -- In production, this might be handled by a webhook or admin function
  UPDATE auth.users
  SET
    email = anonymized_email,
    raw_user_meta_data = jsonb_build_object('disabled_at', CURRENT_TIMESTAMP),
    is_sso_user = FALSE,
    banned_until = '2100-01-01'::timestamptz  -- Effectively bans the user
  WHERE id = user_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in disable_user_account: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Add RLS policy for the function
COMMENT ON FUNCTION public.disable_user_account IS 'Disables a user account by anonymizing personal data and marking the account as inactive';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.disable_user_account TO authenticated;
