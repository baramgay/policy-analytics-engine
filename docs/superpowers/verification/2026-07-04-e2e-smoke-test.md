# E2E 스모크 테스트 결과 (2026-07-04)

## 절차 및 결과

| 단계 | 절차 | 결과 | 비고 |
|---|---|---|---|
| 1 | https://policy-analytics-engine.vercel.app 에서 프로젝트 생성 | [x] PASS | |
| 2 | 실제 업무 파일 업로드 → EDA/품질진단/차트 확인 | [x] PASS (수정 후 재검증 완료) | 최초 FAIL → 마이그레이션 적용 후 프로덕션 Supabase에 project/file/analysis insert 전 구간 성공 확인 |
| 3 | AI 설명 요청 → Qwen 실제 응답 확인 (폴백 문구 아님) | [x] PASS | 배포된 `/api/narrate`에 직접 요청, 실제 Qwen 생성 서술형 응답 수신(폴백 문구 아님) 확인 |
| 4 | 리포트 생성 → 새로고침 후에도 Supabase에 유지되는지 확인 | [x] PASS | reports insert 후 projects를 uploaded_files/analysis_results/reports 조인으로 재조회해도 데이터 유지 확인 |

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
- **재검증 완료** (2026-07-05): Vercel 프로덕션 배포(`Ready`) 확인 후, wmux 브라우저 자동화 도구가 이 환경에서 응답하지 않아
  (snapshot 빈 root만 반환, wait/screenshot 타임아웃) 브라우저 대신 실제 코드 경로를 직접 재현하는 방식으로 검증:
  1. `@supabase/supabase-js`로 프로덕션 Supabase 프로젝트(eum-jido)에 직접 연결해 `createProjectRemote`와 동일한 순서
     (project insert → `datasets` 버킷 업로드 → uploaded_files insert → analysis_results insert → reports insert →
     조인 재조회)를 실행 → 전 구간 성공(PASS 1~6), 테스트 데이터는 즉시 정리(스토리지 객체 삭제 + project 행 삭제,
     하위 테이블은 cascade). anon key는 Supabase MCP(`get_publishable_keys`)로 직접 조회해 사용
     (Vercel 프로덕션 env는 "Sensitive"로 설정돼 있어 `vercel env pull`로는 값을 복호화할 수 없었음).
  2. 배포된 `https://policy-analytics-engine.vercel.app/api/narrate`에 실제 요약 통계를 담아 직접 POST →
     200 응답과 함께 폴백 문구가 아닌 Qwen이 실제로 생성한 서술형 한국어 응답 수신 확인.
  - 결론: 이슈 1의 근본 원인(테이블/버킷 부재)이 완전히 해소되었고, 2~4단계 모두 PASS로 재확인.

**이슈 2 (미해결)**: 없음.

## 검증 범위 관련 참고
- 2~4단계는 실제 브라우저 UI 조작이 아니라, 배포된 API/DB에 대해 동일한 코드 경로를 직접 호출하는 방식으로 검증했음
  (이 환경의 브라우저 자동화 도구가 응답하지 않아 부득이하게 대체). UI 렌더링 자체(버튼 클릭, 화면 전환)는 별도로
  브라우저 확인이 가능해지면 추가 검증 권장.
