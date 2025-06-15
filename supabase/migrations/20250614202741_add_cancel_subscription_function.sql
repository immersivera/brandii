-- Create function to cancel a subscription
CREATE OR REPLACE FUNCTION public.cancel_subscription()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_subscription record;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  -- Check if the user has an active subscription
  SELECT * INTO v_subscription
  FROM public.user_subscriptions
  WHERE user_id = v_user_id
  AND status = 'active'
  LIMIT 1;
  
  -- If no active subscription found, return an error
  IF v_subscription IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No active subscription found'
    );
  END IF;
  
  -- Mark the subscription to be canceled at the end of the billing period
  UPDATE public.user_subscriptions
  SET 
    cancel_at_period_end = true,
    canceled_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  WHERE id = v_subscription.id;
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', 'Subscription will be canceled at the end of the billing period'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
