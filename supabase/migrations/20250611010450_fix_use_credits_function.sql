-- Fix the use_credits function to properly update the credits_used field
CREATE OR REPLACE FUNCTION public.use_credits(
    p_user_id UUID, 
    p_credits_to_use INTEGER,
    p_description TEXT,
    p_reference_id TEXT DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_available_credits INTEGER;
    v_used_credits INTEGER := 0;
    v_remaining_credits INTEGER;
    v_monthly_credits_available INTEGER;
    v_monthly_credits_used INTEGER;
BEGIN
    -- Check available credits within a transaction
    SELECT 
        (purchased_credits + monthly_credits - credits_used),
        monthly_credits,
        credits_used
    INTO 
        v_available_credits,
        v_monthly_credits_available,
        v_monthly_credits_used
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE; -- Lock the row to prevent race conditions
    
    IF NOT FOUND THEN
        RETURN FALSE; -- User credits not found
    END IF;
    
    IF v_available_credits < p_credits_to_use THEN
        RETURN FALSE; -- Not enough credits
    END IF;
    
    -- Calculate how many credits to use from monthly vs purchased
    v_remaining_credits := p_credits_to_use;
    
    -- First, use monthly credits if available
    IF v_monthly_credits_available > v_monthly_credits_used THEN
        v_used_credits := LEAST(
            v_monthly_credits_available - v_monthly_credits_used,
            v_remaining_credits
        );
        
        -- Update credits_used counter
        UPDATE user_credits
        SET credits_used = credits_used + v_used_credits,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        v_remaining_credits := v_remaining_credits - v_used_credits;
    END IF;
    
    -- If there are still credits to use, use purchased credits
    IF v_remaining_credits > 0 THEN
        UPDATE user_credits
        SET purchased_credits = purchased_credits - v_remaining_credits,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
    
    -- Record the usage
    INSERT INTO credit_usage (
        user_id,
        credits_used,
        description,
        reference_id,
        reference_type,
        metadata
    ) VALUES (
        p_user_id,
        p_credits_to_use,
        p_description,
        p_reference_id,
        p_reference_type,
        p_metadata
    );
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    -- Log the error
    RAISE WARNING 'Error in use_credits: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the existing data by updating the credits_used field based on credit_usage records
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT 
            user_id, 
            SUM(credits_used) as total_credits_used 
        FROM 
            credit_usage 
        GROUP BY 
            user_id
    ) LOOP
        UPDATE user_credits
        SET credits_used = r.total_credits_used,
            updated_at = NOW()
        WHERE user_id = r.user_id;
    END LOOP;
END $$;

-- Add a comment to document the function
COMMENT ON FUNCTION public.use_credits IS 'Uses credits from a user''s account, prioritizing monthly credits before purchased credits. Records usage in credit_usage table.';
