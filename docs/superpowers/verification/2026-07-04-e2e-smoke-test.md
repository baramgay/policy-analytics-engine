# E2E 스모크 테스트 결과 (2026-07-04)

## 절차 및 결과

| 단계 | 절차 | 결과 | 비고 |
|---|---|---|---|
| 1 | https://policy-analytics-engine.vercel.app 에서 프로젝트 생성 | [x] PASS | |
| 2 | 실제 업무 파일 업로드 → EDA/품질진단/차트 확인 | [x] FAIL (수정 완료, 재검증 필요) | "분석 중 오류가 발생했습니다" 발생 |
| 3 | AI 설명 요청 → Qwen 실제 응답 확인 (폴백 문구 아님) | [ ] PASS / [ ] FAIL | 2단계 차단으로 미도달 |
| 4 | 리포트 생성 → 새로고침 후에도 Supabase에 유지되는지 확인 | [ ] PASS / [ ] FAIL | 2단계 차단으로 미도달 |

## 발견된 이슈

**이슈 1 (해결됨, 커밋 ccef318)**: 실제 파일 업로드 시 "분석 중 오류가 발생했습니다"로 실패.

- 근본원인: 프로덕션 `NEXT_PUBLIC_SUPABASE_URL`이 가리키는 Supabase 프로젝트("eum-jido", 무관한 타 앱과 공유)에
  `supabase/migrations/0001_init.sql`이 한 번도 적용되지 않아 `projects`/`uploaded_files`/`analysis_results`/`reports`
  테이블 자체가 없었고, `datasets` 스토리지 버킷도 존재하지 않았음.
- 부가 버그 2건도 함께 발견:
  1. `app/(app)/upload/page.tsx`에서 `error instanceof Error`로 에러 메시지를 뽑았으나 Supabase의
     `PostgrestError`는 일반 객체라 항상 폴백 문구만 노출되어 실제 원인이 가려짐.
  2. `lib/data/supabaseStore.ts`의 `createProjectRemote`가 스토리지 업로드 실패(`error`)를 확인하지 않고
     무시하던 silent-failure 버그.
- 조치 (사용자 승인 "바로 적용" 후 진행):
  1. `mcp__supabase__apply_migration`으로 0001_init.sql을 라이브 DB에 적용.
  2. `datasets` 버킷 생성 + anon/authenticated 접근 정책 3종 생성, `supabase/migrations/0002_datasets_bucket.sql`로 파일화.
  3. 위 코드 버그 2건 수정, `npm run build`로 컴파일/타입체크 통과 확인.
  4. 커밋 `ccef318`, `origin/master` 푸시 완료 (Vercel 자동 재배포).
- **후속 조치 필요**: Vercel 재배포 완료 후 배포 URL에서 실제 파일로 2~4단계 재검증 → 이 문서 갱신.

**이슈 2 (미해결)**: 없음 (2단계 차단으로 3~4단계 미검증).
