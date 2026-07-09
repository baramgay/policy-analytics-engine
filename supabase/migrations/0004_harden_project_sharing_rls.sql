-- project_shares/project_comments: 기존 전체 허용 정책 제거, service-role 전용 접근으로 강화
-- (Next.js API 라우트가 service-role 키로 접근, 클라이언트/anon 키는 직접 접근 불가)
drop policy if exists "public read/write project_shares" on project_shares;
drop policy if exists "public read/write project_comments" on project_comments;
