-- datasets 스토리지 버킷 및 anon 접근 정책 (0001_init.sql이 테이블만 만들고 버킷 생성을 누락했었음)
insert into storage.buckets (id, name, public) values ('datasets', 'datasets', false) on conflict (id) do nothing;

drop policy if exists "public insert datasets" on storage.objects;
drop policy if exists "public select datasets" on storage.objects;
drop policy if exists "public update datasets" on storage.objects;

create policy "public insert datasets" on storage.objects for insert to anon, authenticated with check (bucket_id = 'datasets');
create policy "public select datasets" on storage.objects for select to anon, authenticated using (bucket_id = 'datasets');
create policy "public update datasets" on storage.objects for update to anon, authenticated using (bucket_id = 'datasets');
