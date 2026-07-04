# Post-MVP 보강 작업 설계 (2026-07-04)

## 배경

정책 분석 엔진 MVP 8개 태스크 완료, GitHub(`baramgay/policy-analytics-engine`) + Vercel
production(`https://policy-analytics-engine.vercel.app`) 배포 완료, AI narrator는 Qwen(OpenAI
호환 모드)으로 전환 완료. 이 문서는 배포 후 추가로 진행하기로 결정한 3개 작업 트랙을 다룬다.

## 범위

1. 실사용 검증 (E2E 스모크 테스트)
2. 프로젝트 공유 링크 + 리포트 PDF 내보내기
3. 품질 보강 (규칙 기반 분석 엔진 단위 테스트)

각 트랙은 독립적으로 완료 가능하며 서로 의존하지 않는다.

---

## 트랙 1: 실사용 검증

**목적**: 배포된 production 사이트에서 실제 CSV/XLSX 파일 업로드부터 AI 설명, 리포트까지
전체 플로우가 실제로 동작하는지 확인한다. 코드 변경 없음 — 검증 작업.

**검증 절차**:
1. `https://policy-analytics-engine.vercel.app`에서 프로젝트 생성
2. 실제 CSV 파일 업로드 → 대시보드에서 EDA/품질진단/차트 결과 확인
3. AI 설명 요청 → Qwen이 실제 자연어 설명을 반환하는지 확인 (에러 시 "AI 설명 기능은 아직
   준비 중입니다" 폴백이 아니라 실제 응답이 오는지)
4. 리포트 화면 생성 및 Supabase에 저장되는지 확인 (새로고침 후에도 유지되는지)

**성공 기준**: 4단계 모두 에러 없이 완료, AI 설명이 실제 텍스트로 표시됨.

---

## 트랙 2: 프로젝트 공유 링크 + 리포트 PDF 내보내기

### 현재 상태 확인

`lib/data/store.ts`가 Supabase 설정 시 `supabaseStore.ts`(원격)를 사용하고,
`supabase/migrations/0001_init.sql`의 RLS 정책이 전체 공개(`using (true) with check (true)`)로
되어 있다. 즉 `/projects/[id]/report` URL은 **이미 로그인 없이 열리는 공유 가능한 링크**다.
새 라우트나 인증 로직을 추가할 필요가 없다.

### 공유 링크 — 변경 사항

- `components/report/ReportView.tsx`에 "링크 복사" 버튼 추가 — 현재 페이지 URL을
  클립보드에 복사 (`navigator.clipboard.writeText`), 복사 완료 시 짧은 토스트/텍스트 피드백.
- 기존 리포트 화면 레이아웃·네비게이션은 그대로 유지 (별도 read-only 뷰 신설하지 않음 — YAGNI).

### PDF 내보내기 — 접근 방식

서버리스 환경(Vercel)에서 Puppeteer 등으로 PDF를 렌더링하면 콜드스타트 지연과 번들 크기
문제가 크다. 대신 **브라우저 네이티브 `window.print()` + `@media print` 전용 CSS**를 사용한다.

- `ReportView.tsx`에 "PDF로 내보내기" 버튼 추가 → 클릭 시 `window.print()` 호출.
- `app/globals.css`(또는 리포트 전용 CSS 모듈)에 `@media print` 규칙 추가:
  - 내비게이션, 버튼, 사이드바 등 `no-print` 클래스 요소 숨김
  - 리포트 본문 여백·폰트 크기 인쇄용으로 조정
- 새 의존성 추가 없음. 사용자는 브라우저 인쇄 대화상자에서 "PDF로 저장"을 선택하면 된다.

**트레이드오프**: 서버 사이드 PDF 생성만큼 픽셀 단위로 정교하진 않지만, 의존성 0개로
즉시 동작하고 Vercel 서버리스 제약을 피할 수 있다. MVP 단계에서는 이 방식이 적절하다.

---

## 트랙 3: 품질 보강 — 규칙 기반 분석 엔진 단위 테스트

**현황**: 프로젝트 전체에 테스트 파일이 0개 (`find . -name "*.test.*"` 확인 결과 없음).

**우선순위 근거**: 이 프로젝트의 핵심 주장은 "AI가 아니라 엔진이 계산한다"는 것이다.
따라서 UI 테스트보다 `lib/analytics`(EDA·품질진단·기초통계·차트 추천·규칙형 인사이트 계산)에
대한 단위 테스트가 이 주장을 실제로 검증하는 가장 ROI 높은 작업이다.

**적용 범위**:
- Vitest 신규 도입 (`vitest`, `@vitest/ui` 등 devDependency 추가)
- `lib/analytics` 내 순수 함수(입력 데이터 → 요약 통계/차트 스펙/품질 점수)를 대상으로
  단위 테스트 작성 — 정상 케이스, 빈 데이터, 결측치 다수, 단일 컬럼 등 경계 케이스 포함.
- API 라우트(`app/api/narrate/route.ts`)나 UI 컴포넌트 테스트는 이번 범위에서 제외
  (엔진 신뢰성 검증이 목적이므로 범위를 좁게 유지 — YAGNI).

**에러 핸들링 보강**: 사전에 목록화하지 않고, 테스트 작성 및 트랙 1 스모크 테스트 과정에서
실제로 발견되는 이슈만 보강한다 (업로드 실패, AI 타임아웃 등 가상의 시나리오를 미리 만들지 않음).

---

## 완료 기준

- 트랙 1: 4단계 스모크 테스트 통과 기록
- 트랙 2: "링크 복사"/"PDF로 내보내기" 버튼이 리포트 화면에 동작, `tsc --noEmit` + `npm run build` 클린
- 트랙 3: `lib/analytics` 핵심 함수에 대한 Vitest 테스트 그린, `npm run build` 클린
