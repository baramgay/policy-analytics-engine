-- 정책 분석 엔진 MVP 스키마: 프로젝트/업로드파일/분석결과/보고서 4개 테이블
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  title text not null,
  description text,
  data_type text not null,
  analysis_goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists uploaded_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  row_count integer not null default 0,
  column_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists analysis_results (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  quality_score integer not null,
  schema_summary jsonb not null,
  missing_summary jsonb not null,
  numeric_summary jsonb not null,
  categorical_summary jsonb not null,
  chart_specs jsonb not null,
  map_specs jsonb not null,
  insight_summary text not null,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table projects enable row level security;
alter table uploaded_files enable row level security;
alter table analysis_results enable row level security;
alter table reports enable row level security;

-- MVP는 로그인 없이 데모로 동작하므로 우선 전체 허용 정책을 둔다 (배포 전 반드시 강화 필요)
create policy "public read/write projects" on projects for all using (true) with check (true);
create policy "public read/write uploaded_files" on uploaded_files for all using (true) with check (true);
create policy "public read/write analysis_results" on analysis_results for all using (true) with check (true);
create policy "public read/write reports" on reports for all using (true) with check (true);
