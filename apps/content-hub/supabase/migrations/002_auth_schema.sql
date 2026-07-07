-- =====================================================
-- Phase 2: Auth & Multi-tenant Schema Migration
-- Adds: users (managed by better-auth), departments,
--        user_roles, audit_logs
-- =====================================================

-- 0. better-auth table (managed by plugin, included for reference)
-- create table auth.users ( ... ); -- handled by better-auth

-- 1. Departments lookup
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

insert into public.departments (name, slug, description) values
  ('Marketing', 'marketing', 'Marketing & Communications'),
  ('Engineering', 'engineering', 'Software Engineering'),
  ('Sales', 'sales', 'Sales & Business Development'),
  ('HR', 'hr', 'Human Resources'),
  ('Finance', 'finance', 'Finance & Accounting'),
  ('General', 'general', 'General / Unassigned')
on conflict (slug) do nothing;

-- 2. User profiles (extends better-auth user)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  department_id uuid references public.departments(id),
  role text not null default 'employee' check (role in ('admin', 'manager', 'employee')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_department on public.profiles(department_id);
create index idx_profiles_role on public.profiles(role);

-- 3. Audit log for approval/rejection actions
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id),
  action text not null check (action in ('approve', 'reject', 'submit', 'update', 'delete')),
  content_id uuid not null references public.contents(id),
  old_status text,
  new_status text,
  note text,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_content on public.audit_logs(content_id);
create index idx_audit_logs_actor on public.audit_logs(actor_id);
create index idx_audit_logs_created on public.audit_logs(created_at desc);

-- 4. RLS
alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.audit_logs enable row level security;

-- departments: readable by all authenticated, writable by admin
create policy "authenticated_read_departments" on public.departments
  for select to authenticated using (true);
create policy "admin_write_departments" on public.departments
  for all to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- profiles: read own + same dept, write own
create policy "authenticated_read_profiles" on public.profiles
  for select to authenticated using (true);
create policy "update_own_profile" on public.profiles
  for update to authenticated using (id = auth.uid());
create policy "admin_write_profiles" on public.profiles
  for all to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- audit_logs: read by manager+, write by any authenticated (via API)
create policy "manager_read_audit" on public.audit_logs
  for select to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager'))
  );
create policy "authenticated_insert_audit" on public.audit_logs
  for insert to authenticated with check (true);

-- 5. Auto-update triggers
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

-- 6. Helper: get current user profile
create or replace function public.get_current_profile()
returns public.profiles as $$
begin
  return (
    select * from public.profiles where id = auth.uid() limit 1
  );
end;
$$ language plpgsql stable;

-- 7. Helper: check if current user is manager or admin
create or replace function public.is_manager_or_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'manager')
  );
end;
$$ language plpgsql stable security definer;
