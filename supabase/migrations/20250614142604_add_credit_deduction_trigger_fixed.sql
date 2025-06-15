-- Create a function to handle credit deduction when a new credit_usage record is inserted
CREATE OR REPLACE FUNCTION public.handle_credit_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_monthly_credits_available INTEGER;
  v_credits_used INTEGER;
  v_credits_to_deduct_from_monthly INTEGER;
  v_credits_to_deduct_from_purchased INTEGER;
  v_current_credits_used INTEGER;
BEGIN
  -- Get the user's current credit status
  SELECT 
    monthly_credits - COALESCE(credits_used, 0),
    COALESCE(credits_used, 0)
  INTO 
    v_monthly_credits_available,
    v_current_credits_used
  FROM user_credits
  WHERE user_id = NEW.user_id
  FOR UPDATE; -- Lock the row to prevent race conditions
  
  -- If no credits record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, monthly_credits, credits_used, purchased_credits)
    VALUES (NEW.user_id, 0, 0, 0);
    
    v_monthly_credits_available := 0;
    v_current_credits_used := 0;
  END IF;
  
  -- Calculate how many credits to take from monthly vs purchased
  v_credits_to_deduct_from_monthly := LEAST(NEW.credits_used, v_monthly_credits_available);
  v_credits_to_deduct_from_purchased := GREATEST(0, NEW.credits_used - v_credits_to_deduct_from_monthly);
  
  -- Update the user's credit record
  UPDATE user_credits
  SET 
    credits_used = credits_used + v_credits_to_deduct_from_monthly,
    purchased_credits = GREATEST(0, purchased_credits - v_credits_to_deduct_from_purchased),
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  -- Update the credit_usage record with the breakdown
  NEW.metadata = COALESCE(NEW.metadata, '{}'::jsonb) || jsonb_build_object(
    'credit_breakdown', jsonb_build_object(
      'from_monthly', v_credits_to_deduct_from_monthly,
      'from_purchased', v_credits_to_deduct_from_purchased,
      'monthly_remaining', GREATEST(0, v_monthly_credits_available - v_credits_to_deduct_from_monthly)
    )
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error in handle_credit_usage: %', SQLERRM;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_credit_usage_created ON public.credit_usage;
CREATE TRIGGER on_credit_usage_created
BEFORE INSERT ON public.credit_usage
FOR EACH ROW
EXECUTE FUNCTION public.handle_credit_usage();

-- Add a comment to document the function
COMMENT ON FUNCTION public.handle_credit_usage IS 'Automatically deducts credits from monthly allowance first, then purchased credits when a new credit_usage record is created';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_credit_usage() TO authenticated;

-- Update the RLS policy to allow the trigger to work
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow the trigger to update user_credits
DROP POLICY IF EXISTS "Allow credit deduction in triggers" ON public.user_credits;
CREATE POLICY "Allow credit deduction in triggers"
ON public.user_credits
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
