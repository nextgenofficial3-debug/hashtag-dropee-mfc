create table if not exists public.mfc_admin_whitelist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role public.app_role not null default 'admin',
  created_at timestamptz not null default now()
);

alter table public.mfc_admin_whitelist enable row level security;

create table if not exists public.mfc_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reservation_time timestamptz not null,
  people_count integer not null check (people_count > 0),
  table_type text not null default 'indoor',
  special_requests text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mfc_reservations enable row level security;

alter table public.mfc_store_settings
  add column if not exists brand_name text default 'MFC Food',
  add column if not exists brand_logo_url text;

alter table public.mfc_orders
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.delivery_orders
  add column if not exists customer_user_id uuid references auth.users(id) on delete set null;

alter table public.mfc_orders enable row level security;
alter table public.delivery_orders enable row level security;
alter table public.mfc_store_settings enable row level security;

create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  with actor as (
    select lower(email) as email
    from auth.users
    where id = _user_id
  )
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role::text = _role
  ) or exists (
    select 1
    from actor
    join public.mfc_admin_whitelist on lower(public.mfc_admin_whitelist.email) = actor.email
    where public.mfc_admin_whitelist.role::text = _role
       or public.mfc_admin_whitelist.role::text = 'super_admin'
  );
$$;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.has_role(_user_id, _role::text);
$$;

create or replace function public.update_mfc_reservations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_mfc_reservations_updated_at on public.mfc_reservations;
create trigger update_mfc_reservations_updated_at
before update on public.mfc_reservations
for each row
execute function public.update_mfc_reservations_updated_at();

drop policy if exists "Admins can read admin whitelist" on public.mfc_admin_whitelist;
create policy "Admins can read admin whitelist"
on public.mfc_admin_whitelist
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can manage admin whitelist" on public.mfc_admin_whitelist;
create policy "Admins can manage admin whitelist"
on public.mfc_admin_whitelist
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Public can read store settings" on public.mfc_store_settings;
create policy "Public can read store settings"
on public.mfc_store_settings
for select
using (true);

drop policy if exists "Admins can manage store settings" on public.mfc_store_settings;
create policy "Admins can manage store settings"
on public.mfc_store_settings
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Customers can insert own mfc orders" on public.mfc_orders;
create policy "Customers can insert own mfc orders"
on public.mfc_orders
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Customers can read own mfc orders" on public.mfc_orders;
create policy "Customers can read own mfc orders"
on public.mfc_orders
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Admins can manage mfc orders" on public.mfc_orders;
create policy "Admins can manage mfc orders"
on public.mfc_orders
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Customers can insert own delivery orders" on public.delivery_orders;
create policy "Customers can insert own delivery orders"
on public.delivery_orders
for insert
to authenticated
with check (customer_user_id = auth.uid());

drop policy if exists "Customers can read own delivery orders" on public.delivery_orders;
create policy "Customers can read own delivery orders"
on public.delivery_orders
for select
to authenticated
using (customer_user_id = auth.uid());

drop policy if exists "Admins can manage delivery orders" on public.delivery_orders;
create policy "Admins can manage delivery orders"
on public.delivery_orders
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Customers can insert own reservations" on public.mfc_reservations;
create policy "Customers can insert own reservations"
on public.mfc_reservations
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Customers can read own reservations" on public.mfc_reservations;
create policy "Customers can read own reservations"
on public.mfc_reservations
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Admins can manage reservations" on public.mfc_reservations;
create policy "Admins can manage reservations"
on public.mfc_reservations
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

insert into public.mfc_admin_whitelist (email, role)
values ('hashtagdropee@gmail.com', 'super_admin')
on conflict (email) do nothing;
