-- Fix MFC admin product CRUD, image uploads, and admin-visible users.

create schema if not exists mfc_private;

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('promotion-banners', 'promotion-banners', true)
on conflict (id) do update set public = excluded.public;

alter table public.mfc_categories enable row level security;
alter table public.mfc_products enable row level security;

drop policy if exists "mfc: anyone can read categories" on public.mfc_categories;
create policy "mfc: anyone can read categories"
on public.mfc_categories
for select
using (true);

drop policy if exists "mfc: admins can manage categories" on public.mfc_categories;
create policy "mfc: admins can manage categories"
on public.mfc_categories
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "mfc: anyone can read products" on public.mfc_products;
create policy "mfc: anyone can read products"
on public.mfc_products
for select
using (true);

drop policy if exists "mfc: admins can manage products" on public.mfc_products;
create policy "mfc: admins can manage products"
on public.mfc_products
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Anyone can view product images" on storage.objects;
drop policy if exists "Authenticated users can upload product images" on storage.objects;
drop policy if exists "Authenticated users can update product images" on storage.objects;
drop policy if exists "Authenticated users can delete product images" on storage.objects;
drop policy if exists "mfc: public can view admin images" on storage.objects;
drop policy if exists "mfc: admins can upload product images" on storage.objects;
drop policy if exists "mfc: admins can update product images" on storage.objects;
drop policy if exists "mfc: admins can delete product images" on storage.objects;

create policy "mfc: public can view admin images"
on storage.objects
for select
using (bucket_id in ('product-images', 'promotion-banners'));

create policy "mfc: admins can upload product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('product-images', 'promotion-banners')
  and public.has_role(auth.uid(), 'admin')
);

create policy "mfc: admins can update product images"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('product-images', 'promotion-banners')
  and public.has_role(auth.uid(), 'admin')
)
with check (
  bucket_id in ('product-images', 'promotion-banners')
  and public.has_role(auth.uid(), 'admin')
);

create policy "mfc: admins can delete product images"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('product-images', 'promotion-banners')
  and public.has_role(auth.uid(), 'admin')
);

create table if not exists public.mfc_user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_sign_in_at timestamptz
);

alter table public.mfc_user_profiles enable row level security;

drop policy if exists "mfc: users can read own profile" on public.mfc_user_profiles;
create policy "mfc: users can read own profile"
on public.mfc_user_profiles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "mfc: admins can read user profiles" on public.mfc_user_profiles;
create policy "mfc: admins can read user profiles"
on public.mfc_user_profiles
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "mfc: users can update own profile basics" on public.mfc_user_profiles;
create policy "mfc: users can update own profile basics"
on public.mfc_user_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function mfc_private.sync_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.mfc_user_profiles (
    user_id,
    email,
    full_name,
    phone,
    avatar_url,
    created_at,
    updated_at,
    last_sign_in_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.phone, new.raw_user_meta_data->>'phone'),
    new.raw_user_meta_data->>'avatar_url',
    new.created_at,
    now(),
    new.last_sign_in_at
  )
  on conflict (user_id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    phone = excluded.phone,
    avatar_url = excluded.avatar_url,
    updated_at = now(),
    last_sign_in_at = excluded.last_sign_in_at;

  return new;
end;
$$;

drop trigger if exists trg_mfc_sync_user_profile on auth.users;
create trigger trg_mfc_sync_user_profile
after insert or update of email, phone, raw_user_meta_data, last_sign_in_at
on auth.users
for each row execute function mfc_private.sync_user_profile();

insert into public.mfc_user_profiles (
  user_id,
  email,
  full_name,
  phone,
  avatar_url,
  created_at,
  updated_at,
  last_sign_in_at
)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'),
  coalesce(phone, raw_user_meta_data->>'phone'),
  raw_user_meta_data->>'avatar_url',
  created_at,
  now(),
  last_sign_in_at
from auth.users
on conflict (user_id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  phone = excluded.phone,
  avatar_url = excluded.avatar_url,
  updated_at = now(),
  last_sign_in_at = excluded.last_sign_in_at;

create or replace function public.mfc_bridge_order_to_delivery()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_code text;
  v_delivery_order_id uuid;
  v_pickup_address text := 'MFC - Makyo Fried Chicken, Ukhrul';
begin
  v_order_code := 'MFC-' || upper(substring(replace(new.id::text, '-', ''), 1, 6));

  insert into public.delivery_orders (
    order_code,
    customer_user_id,
    customer_name,
    customer_phone,
    delivery_address,
    pickup_address,
    package_description,
    special_instructions,
    status,
    created_at,
    updated_at
  ) values (
    v_order_code,
    new.user_id,
    new.customer_name,
    new.customer_phone,
    new.customer_address,
    v_pickup_address,
    (select string_agg((item->>'name') || ' x' || (item->>'quantity'), ', ') from jsonb_array_elements(new.items) as item),
    new.special_instructions,
    'pending_assignment',
    new.created_at,
    now()
  )
  returning id into v_delivery_order_id;

  update public.mfc_orders set hub_order_id = v_delivery_order_id::text where id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_mfc_bridge_order on public.mfc_orders;
create trigger trg_mfc_bridge_order
after insert on public.mfc_orders
for each row execute function public.mfc_bridge_order_to_delivery();
