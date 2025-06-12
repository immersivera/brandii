-- Create a view to easily get user's available credits
-- This view combines user_credits and user_subscriptions to provide a comprehensive view of a user's credit status

-- Drop the view if it already exists
DROP VIEW IF EXISTS public.user_available_credits;

-- Create the view
CREATE OR REPLACE VIEW public.user_available_credits AS
SELECT 
    uc.user_id,
    uc.purchased_credits,
    uc.monthly_credits,
    uc.credits_used,
    (uc.monthly_credits + uc.purchased_credits - uc.credits_used) AS available_credits,
    us.status AS subscription_status,
    us.current_period_end AS subscription_ends_at,
    uc.updated_at
FROM 
    public.user_credits uc
LEFT JOIN 
    public.user_subscriptions us ON uc.user_id = us.user_id 
    AND us.status = 'active'  -- Only join with active subscriptions
    AND (us.current_period_end IS NULL OR us.current_period_end > NOW());  -- Only include subscriptions that haven't ended

-- Add a comment to document the view
COMMENT ON VIEW public.user_available_credits IS 'Provides a consolidated view of user credits and subscription status, including available credits calculation.';

-- Grant permissions
GRANT SELECT ON public.user_available_credits TO authenticated;

-- Note: Not applying RLS to the view as it's handled at the table level
-- The underlying tables (user_credits, user_subscriptions) already have RLS policies
-- that restrict users to only see their own data

-- Grant permissions (already handled above)
-- GRANT SELECT ON public.user_available_credits TO authenticated;
