-- Create a function to save assets and deduct credits in a single transaction
CREATE OR REPLACE FUNCTION public.save_assets_and_deduct_credits(
  p_user_id UUID,
  p_brand_kit_id UUID,
  p_assets JSONB[],
  p_credits_to_use INTEGER,
  p_description TEXT,
  p_reference_type TEXT DEFAULT 'image_generation'
) 
RETURNS SETOF generated_assets
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_asset generated_assets%ROWTYPE;
  v_saved_assets generated_assets[];
  v_reference_id TEXT;
  v_credit_deduction_success BOOLEAN;
BEGIN
  -- Start by deducting credits
  SELECT public.use_credits(
    p_user_id,
    p_credits_to_use,
    p_description,
    NULL, -- reference_id will be set after saving assets
    p_reference_type,
    jsonb_build_object('brand_kit_id', p_brand_kit_id, 'asset_count', p_credits_to_use)
  ) INTO v_credit_deduction_success;
  
  IF NOT v_credit_deduction_success THEN
    RAISE EXCEPTION 'Insufficient credits or error deducting credits';
  END IF;
  
  -- Save each asset
  FOR i IN 1..array_length(p_assets, 1) LOOP
    INSERT INTO public.generated_assets (
      brand_kit_id,
      image_data,
      image_url,
      type,
      image_prompt
    ) VALUES (
      p_brand_kit_id,
      (p_assets[i]->>'image_data')::TEXT,
      (p_assets[i]->>'image_url')::TEXT,
      (p_assets[i]->>'type')::TEXT::"generated_asset_type",
      (p_assets[i]->>'image_prompt')::TEXT
    )
    RETURNING * INTO v_asset;
    
    v_saved_assets := array_append(v_saved_assets, v_asset);
  END LOOP;
  
  -- Return all saved assets
  RETURN QUERY SELECT * FROM unnest(v_saved_assets);
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error in save_assets_and_deduct_credits: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.save_assets_and_deduct_credits(
  UUID, UUID, JSONB[], INTEGER, TEXT, TEXT
) TO authenticated;

-- Add a comment to document the function
COMMENT ON FUNCTION public.save_assets_and_deduct_credits IS 'Saves generated assets and deducts credits in a single transaction. Takes user_id, brand_kit_id, assets array, credits_to_use, description, and reference_type as parameters.';
