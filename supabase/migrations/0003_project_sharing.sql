-- 프로젝트 공유 링크(project_shares) 및 댓글(project_comments) 테이블
create table if not exists project_shares (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  author_name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table project_shares enable row level security;
alter table project_comments enable row level security;

-- 공유 링크/댓글은 로그인 없이 공개 접근하는 MVP 특성상 우선 전체 허용 정책을 둔다 (배포 전 반드시 강화 필요)
create policy "public read/write project_shares" on project_shares for all using (true) with check (true);
create policy "public read/write project_comments" on project_comments for all using (true) with check (true);

create index if not exists project_shares_token_idx on project_shares (token);
create index if not exists project_comments_project_id_idx on project_comments (project_id);
