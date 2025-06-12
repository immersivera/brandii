-- Migration: Add update policy to generated_assets table
-- Description: Allows users to update their own generated assets

-- Create a new update policy following the same pattern as existing policies
CREATE POLICY "Users can update their brand kit assets"
ON public.generated_assets
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM brand_kits
    WHERE brand_kits.id = generated_assets.brand_kit_id
    AND brand_kits.user_id = (auth.uid())::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_kits
    WHERE brand_kits.id = generated_assets.brand_kit_id
    AND brand_kits.user_id = (auth.uid())::text
  )
);
