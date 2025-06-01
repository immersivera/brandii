-- Create users table extension
create extension if not exists "uuid-ossp";

-- Create brand_kits table
create table if not exists public.brand_kits (
    id uuid default uuid_generate_v4() primary key,
    user_id text not null,
    name text not null,
    description text,
    type text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    colors jsonb not null default '{
        "primary": "#8B5CF6",
        "secondary": "#6D28D9",
        "accent": "#EC4899",
        "background": "#F5F3FF",
        "text": "#111827"
    }'::jsonb,
    logo jsonb not null default '{
        "type": "wordmark",
        "text": ""
    }'::jsonb,
    typography jsonb not null default '{
        "headingFont": "Inter",
        "bodyFont": "Inter"
    }'::jsonb
);

-- Create RLS policies
alter table public.brand_kits enable row level security;

create policy "Users can view their own brand kits"
    on public.brand_kits for select
    using (auth.uid()::text = user_id or user_id like 'anon_%');

create policy "Users can insert their own brand kits"
    on public.brand_kits for insert
    with check (auth.uid()::text = user_id or user_id like 'anon_%');

create policy "Users can update their own brand kits"
    on public.brand_kits for update
    using (auth.uid()::text = user_id or user_id like 'anon_%');

create policy "Users can delete their own brand kits"
    on public.brand_kits for delete
    using (auth.uid()::text = user_id or user_id like 'anon_%');

-- Create function to handle brand kit updates
create or replace function public.handle_brand_kit_updated()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger for updating updated_at timestamp
create trigger brand_kits_updated
    before update on public.brand_kits
    for each row
    execute procedure public.handle_brand_kit_updated();