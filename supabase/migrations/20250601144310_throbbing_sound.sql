-- Create generated_assets table
create table if not exists public.generated_assets (
    id uuid default uuid_generate_v4() primary key,
    brand_kit_id uuid references brand_kits(id) on delete cascade not null,
    image_data text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.generated_assets enable row level security;

-- Create RLS policies
create policy "Users can view their brand kit assets"
    on public.generated_assets for select
    using (
        exists (
            select 1 from brand_kits
            where brand_kits.id = generated_assets.brand_kit_id
            and (auth.uid()::text = brand_kits.user_id or brand_kits.user_id like 'anon_%')
        )
    );

create policy "Users can insert their brand kit assets"
    on public.generated_assets for insert
    with check (
        exists (
            select 1 from brand_kits
            where brand_kits.id = generated_assets.brand_kit_id
            and (auth.uid()::text = brand_kits.user_id or brand_kits.user_id like 'anon_%')
        )
    );

create policy "Users can delete their brand kit assets"
    on public.generated_assets for delete
    using (
        exists (
            select 1 from brand_kits
            where brand_kits.id = generated_assets.brand_kit_id
            and (auth.uid()::text = brand_kits.user_id or brand_kits.user_id like 'anon_%')
        )
    );