-- Update RLS policies for generated_assets table to allow public viewing

-- Drop existing select policy
drop policy if exists "Users can view their brand kit assets" on generated_assets;

-- Create new public select policy
create policy "Anyone can view generated assets"
    on public.generated_assets for select
    using (true);

-- Create index to improve query performance
create index if not exists generated_assets_type_idx on generated_assets(type);
create index if not exists generated_assets_created_at_idx on generated_assets(created_at desc);

-- Add comment to explain public access
comment on table public.generated_assets is 'Stores AI-generated brand assets with public read access';