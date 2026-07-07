-- Phase 3: Advanced Features Migration
-- Versioning, realtime support, analytics helpers
-- =====================================================

-- 1. Content versions table
create table if not exists public.content_versions (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents(id) on delete cascade,
  version_number int not null,
  title text not null,
  original_content text not null,
  ai_content text,
  status text not null,
  tags text[] default '{}',
  changed_by uuid references auth.users(id),
  change_note text,
  created_at timestamptz not null default now()
);

create index idx_content_versions_content on public.content_versions(content_id);
create index idx_content_versions_created on public.content_versions(created_at desc);

alter table public.content_versions enable row level security;

create policy "authenticated_read_versions" on public.content_versions
  for select to authenticated using (true);
create policy "authenticated_insert_versions" on public.content_versions
  for insert to authenticated with check (true);

-- Trigger: auto-create version on content update
create or replace function public.create_content_version()
returns trigger as $$
begin
  insert into public.content_versions (
    content_id, version_number, title, original_content, ai_content, status, tags, changed_by
  ) values (
    NEW.id,
    COALESCE((select max(version_number) from public.content_versions where content_id = NEW.id), 0) + 1,
    NEW.title,
    NEW.original_content,
    NEW.ai_content,
    NEW.status,
    NEW.tags,
    auth.uid()
  );
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists content_version_trigger on public.contents;
create trigger content_version_trigger
  after update on public.contents
  for each row execute function public.create_content_version();

-- 2. Realtime: enable replication for contents table
alter publication supabase_realtime add table public.contents;
alter publication supabase_realtime add table public.audit_logs;

-- 3. Analytics helper view
create or replace view public.content_stats as
select
  date_trunc('day', created_at) as day,
  status,
  department,
  count(*) as count
from public.contents
group by 1, 2, 3
order by 1 desc;
