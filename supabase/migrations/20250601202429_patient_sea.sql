-- Add selected_asset_id column to brand_kits table
ALTER TABLE public.brand_kits
ADD COLUMN logo_selected_asset_id uuid REFERENCES generated_assets(id) ON DELETE SET NULL;

-- Update existing brand kits to use their first generated logo as selected
UPDATE public.brand_kits bk
SET logo_selected_asset_id = ga.id
FROM generated_assets ga
WHERE ga.brand_kit_id = bk.id
AND ga.type = 'logo'
AND NOT EXISTS (
  SELECT 1 FROM generated_assets ga2
  WHERE ga2.brand_kit_id = bk.id
  AND ga2.type = 'logo'
  AND ga2.created_at < ga.created_at
);