-- =====================================================
-- Mekong Content Hub — Supabase Migration
-- Features: pgvector, full-text search, RLS, auto-tag trigger
-- =====================================================

-- 1. Enable extensions
create extension if not exists vector;
create extension if not exists pgcrypto;

-- 2. Drop & recreate table (idempotent)
drop table if exists public.contents;

create table public.contents (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  original_content text not null,
  ai_content    text,
  status        text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  tags          text[] default '{}',
  department    text not null default 'general',
  embedding     vector(1536),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 3. Indexes
create index idx_contents_status on public.contents(status);
create index idx_contents_department on public.contents(department);
create index idx_contents_created_at on public.contents(created_at desc);

-- HNSW index for vector similarity (cosine distance)
create index idx_contents_embedding
  on public.contents
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- GIN index for tag array search
create index idx_contents_tags on public.contents using gin(tags);

-- GIN index for full-text search on title + content
create index idx_contents_fts
  on public.contents
  using gin(to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(original_content, '')));

-- 4. RLS
alter table public.contents enable row level security;

create policy "authenticated_read" on public.contents
  for select to authenticated using (true);

create policy "authenticated_insert" on public.contents
  for insert to authenticated with check (true);

create policy "authenticated_update" on public.contents
  for update to authenticated using (true);

-- 5. Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists contents_updated_at on public.contents;
create trigger contents_updated_at
  before update on public.contents
  for each row execute function public.handle_updated_at();

-- 6. Semantic search function (hybrid: vector + full-text)
create or replace function public.search_contents(
  query_text text,
  match_limit int default 20
)
returns table (
  id uuid,
  title text,
  original_content text,
  ai_content text,
  status text,
  tags text[],
  department text,
  created_at timestamptz,
  similarity float
)
language sql
as $$
  with semantic as (
    select
      c.id, c.title, c.original_content, c.ai_content,
      c.status, c.tags, c.department, c.created_at,
      1 - (c.embedding <=> (openai_embed('text-embedding-3-small', query_text)::vector)) as sim
    from public.contents c
    where c.embedding is not null
  ),
  lexical as (
    select
      c.id, c.title, c.original_content, c.ai_content,
      c.status, c.tags, c.department, c.created_at,
      ts_rank(
        to_tsvector('simple', coalesce(c.title, '') || ' ' || coalesce(c.original_content, '')),
        websearch_to_tsquery('simple', query_text)
      ) as sim
    from public.contents c
    where websearch_to_tsquery('simple', query_text) @@ to_tsvector('simple', coalesce(c.title, '') || ' ' || coalesce(c.original_content, ''))
  )
  select id, title, original_content, ai_content, status, tags, department, created_at, similarity
  from (
    select * from semantic
    union all
    select * from lexical
  ) combined
  group by id, title, original_content, ai_content, status, tags, department, created_at, similarity
  order by similarity desc
  limit match_limit;
$$;

-- 7. Seed data (5 sample posts)
insert into public.contents (title, original_content, department, status, tags, ai_content) values
(
  'Chiến lược Marketing Q3/2026',
  'Để tăng trưởng trong quý 3, chúng ta cần tập trung vào 3 trụ cột: nội dung chất lượng, phân tích dữ liệu và cá nhân hóa trải nghiệm khách hàng.',
  'Marketing',
  'approved',
  array['marketing', 'chiến lược', 'Q3-2026'],
  'CHIẾN LƯỢC MARKETING Q3/2026 — 3 Trụ Cột Tăng Trưởng Bùng Nổ

Xu hướng 2026 đã thay đổi hoàn toàn cách chúng ta tiếp cận khách hàng. Dưới đây là 3 trụ cột then chốt:

1. NỘI DUNG CHẤT LƯỢNG
Không còn chỗ cho nội dung trung bình. Hãy đầu tư vào storytelling, data-driven content và video short-form.

2. PHÂN TÍCH DỮ LIỆU
Dùng AI để phân tích behavior, dự đoán trend và tối ưu funnel theo thời gian thực.

3. CÁ NHÂN HÓA TRẢI NGHIỆM
Mỗi khách hàng đều muốn được đối xử riêng biệt. Tích hợp CRM + AI recommendation engine.

Kết luận: áp dụng ngay 3 trụ cột này để đạt KPIs quý 3 vượt mục tiêu 30%.'
),
(
  'Hướng dẫn Onboarding Nhân Viên Mới 2026',
  'Quy trình onboarding mới gồm 5 bước: đăng ký tài khoản, training nền tảng, mentoring 30 ngày, đánh giá và chính thức đi vào hoạt động.',
  'HR',
  'approved',
  array['HR', 'onboarding', 'nhân viên'],
  'HƯỚNG DẪN ONBOARDING NHÂN VIÊN MỚI 2026

5 bước vàng để nhân viên mới vận hành hiệu quả từ ngày đầu:

Bước 1: ĐĂNG KÝ TÀI KHOẢN
Cung cấp quyền truy cập tất cả công cụ nội bộ, email, Slack và tài liệu.

Bước 2: TRAINING NỀN TẢNG
Đào tạo về văn hóa công ty, quy trình làm việc và công nghệ nền tảng.

Bước 3: MENTORING 30 NGÀY
Gắn buddy để hỗ trợ, giải đáp thắc mắc và giúp nhân viên mới hòa nhập nhanh.

Bước 4: ĐÁNH GIÁ
Kiểm tra tiến độ qua checklist 15 tiêu chí, nhận phản hồi từ cả hai phía.

Bước 5: CHÍNH THỨC HOẠT ĐỘNG
Ký hợp đồng chính thức, cấp quyền truy cập đầy đủ và bắt đầu đóng góp.'
),
(
  'Báo cáo Tài Chính Tháng 5/2026',
  'Doanh thu tháng 5 đạt 2.3 tỷ đồng, tăng 15% so với tháng 4. Chi phí hoạt động giảm 5% nhờ tối ưu hóa quy trình. Lợi nhuận ròng: 450 triệu.',
  'Tài chính',
  'pending',
  array[],
  null
),
(
  'Kế hoạch Phát Triển Sản Phẩm',
  'Quý 3 sẽ ra mắt 2 tính năng mới: AI-powered search và real-time collaboration. Timeline: tháng 7-8 phát triển, tháng 9 testing và rollout.',
  'Sản phẩm',
  'pending',
  array[],
  null
),
(
  'Nội dung Mạng Xã Hội Tuần 24',
  'Lịch đăng bài tuần 24: thứ 2 — tips productivity, thứ 3 — case study khách hàng, thứ 4 — behind the scenes, thứ 5 — Q&A, thứ 6 — teaser sản phẩm mới.',
  'Marketing',
  'approved',
  array['social media', 'content calendar', 'tuần 24'],
  'LỊCH ĐĂNG BÀI MẠNG XÃ HỘI — TUẦN 24

Chiến lược content calendar tuần 24 được thiết kế để tăng engagement 25%:

📅 THỨ 2: Productivity Tips
Chia sẻ 3 mẹo tăng năng suất cho đội ngũ vận hành.

📅 THỨ 3: Case Study
Phóng sự khách hàng thành công — kể chuyện bằng data + cảm xúc.

📅 THỨ 4: Behind The Scenes
Đưa fan vào hậu trường, build authenticity và trust.

📅 THỨ 5: Q&A Interactive
Hỏi đáp trực tiếp với team leader — tăng tương tác 2 chiều.

📅 THỨ 6: Product Teaser
Teaser tính năng mới — tạo anticipation trước khi ra mắt.'
)
on conflict (id) do nothing;
