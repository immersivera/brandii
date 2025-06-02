-- Add image_prompt column to generated_assets table
ALTER TABLE public.generated_assets
ADD COLUMN image_prompt text;