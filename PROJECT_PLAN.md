# PROJECT_PLAN — Policy Analytics Engine (MVP)

> "AI가 분석하는 서비스가 아니라, 분석 엔진이 계산하고 AI가 설명하는 공공데이터 분석 플랫폼"

작성일: 2026-07-04 · 위치: `C:\업무\분석툴` · 상태: **계획 단계 (구현 전, MVP 범위 확정 대기)**

---

## 1. 서비스 개요

공공·민간 데이터 파일(CSV/XLSX)을 업로드하면 **자체 규칙형 분석 엔진**이
EDA, 품질진단, 기초통계, 차트 추천, 지도 감지, 규칙형 인사이트를 생성하고,
AI API는 **계산된 요약 결과를 자연어로 다듬는 보조 역할**만 수행하는 데이터 분석 플랫폼.

핵심 차별점 (심사 포인트):
- 원자료는 AI에 전달되지 않음 — 분석은 100% 자체 엔진(TypeScript)이 수행
- AI에는 요약 JSON(스키마·통계·품질점수·차트 설명)만 전달 → "AI Wrapper 아님"을 구조로 증명
- Supabase 미연결 상태에서도 더미 데이터 데모 모드로 전 화면 시연 가능

## 2. 기술 스택

| 항목 | 선택 | 비고 |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | |
| UI | **Astryx** (`@astryxdesign/core` + `@astryxdesign/theme-neutral`) | Meta 오픈소스, 160+ 컴포넌트, CSS import만으로 동작 |
| 차트 | Recharts | |
| 테이블 | TanStack Table | |
| 지도 | MapLibre GL JS | |
| 아이콘 | Lucide React | |
| DB/Auth/Storage | Supabase | |
| 배포 | Vercel | |
| 파일 파싱 | papaparse (CSV), SheetJS `xlsx` (XLSX) | UI 라이브러리 아님 — 엔진 의존성 |
| AI | Anthropic API (aiNarrator 전용, 선택적) | 키 없으면 규칙형 인사이트 그대로 표시 |

### Astryx 도입 방식 (조회 결과 기준)
```bash
npm install @astryxdesign/core @astryxdesign/theme-neutral
npm install -D @astryxdesign/cli
```
```css
/* app/globals.css */
@import '@astryxdesign/core/reset.css';
@import '@astryxdesign/core/astryx.css';
@import '@astryxdesign/theme-neutral/theme.css';
```
- 컴포넌트는 카테고리별 서브패스 import: `import {Button} from '@astryxdesign/core/Button'`
- 테마 = CSS 커스텀 프로퍼티 오버라이드 (빌드 플러그인 불필요 → Vercel 배포 안전)
- 구현 중 컴포넌트 문서 조회: `npx astryx --json component <이름>` / `npx astryx search <질의>`
  (Astryx MCP 미연결 환경에서는 CLI JSON API가 동일 역할 수행)

## 3. 핵심 사용자 흐름

```
Landing → [시작하기] → Dashboard → [새 분석] → Upload(파일+목적+유형)
  → 클라이언트 분석 엔진 실행(수 초) → Project Detail(품질·스키마·통계)
  → Analysis Dashboard(KPI·차트·테이블·지도·AI 인사이트)
  → Report(초안 생성·복사)
```

- 분석은 **브라우저(클라이언트)에서 실행** → 서버 부담 없음, 데모 즉시성 확보
- 분석 결과 JSON만 Supabase에 저장 (원본 파일은 Storage에 별도 보관)
- 데모 모드: Supabase env 미설정 시 `data/demo/` 더미 데이터로 전 화면 자동 동작

## 4. 화면 구성 × Astryx 컴포넌트 매핑

공통 레이아웃: **App Shell + Side Nav + Top Nav** (Astryx Layout/Navigation)

| 화면 | 경로 | 주요 Astryx 컴포넌트 | 외부 |
|---|---|---|---|
| Landing | `/` | Heading, Text, Card×4(기능 카드), Button, Section, Grid | Lucide 아이콘 |
| Dashboard | `/dashboard` | Card(KPI), Table 또는 List(프로젝트 목록), Badge(분석 상태), Empty State | — |
| Upload | `/upload` | File Input, Text Area(분석 목적), Selector(데이터 유형), Form Layout, Button, Progress Bar | — |
| Project Detail | `/projects/[id]` | Card, Metadata List, Progress Bar(품질 점수), Badge, Tab List, List(추천 분석) | — |
| Analysis Dashboard | `/projects/[id]/analysis` | Card(KPI), Tab List, Grid, Skeleton(로딩), Banner | Recharts, TanStack Table, MapLibre |
| Report | `/projects/[id]/report` | Card, Markdown, Button(복사), Toast(복사 완료), Divider | — |

참고 Astryx 템플릿: Searchable Table(대시보드 목록), Documentation Catalog(랜딩 구조), Settings Panels(상세 페이지 섹션 구조)

## 5. DB 스키마 (Supabase)

```sql
-- projects: 분석 프로젝트 단위
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,        -- MVP: nullable (익명 데모 허용)
  title text not null,
  description text,
  data_type text not null default 'general', -- 생활인구|카드매출|교통|문화|관광|부동산|일반
  analysis_goal text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- uploaded_files: 업로드 파일 메타
create table uploaded_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade,
  file_name text not null,
  file_path text not null,                   -- Supabase Storage 경로
  file_type text not null,                   -- csv | xlsx
  row_count int,
  column_count int,
  created_at timestamptz default now()
);

-- analysis_results: 엔진 산출물 (요약 JSON만 저장, 원자료 저장 금지)
create table analysis_results (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade,
  quality_score numeric,                     -- 0~100
  schema_summary jsonb,                      -- schemaProfiler 산출
  missing_summary jsonb,                     -- qualityChecker 산출
  numeric_summary jsonb,                     -- statsGenerator 산출
  categorical_summary jsonb,
  chart_specs jsonb,                         -- chartRecommender 산출
  map_specs jsonb,                           -- mapDetector 산출
  insight_summary text,                      -- insightGenerator + (선택) aiNarrator
  created_at timestamptz default now()
);

-- reports: 보고서 초안
create table reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade,
  title text not null,
  content text not null,                     -- Markdown
  created_at timestamptz default now()
);
```

- RLS: 4개 테이블 모두 enable + `user_id` 기준 정책 (MVP는 anon 읽기·쓰기 허용 정책 병행, 심사 후 잠금)
- `updated_at` 트리거 1개 (projects)

## 6. Supabase Storage 구조

```
bucket: datasets (private)
  {project_id}/
    raw/{원본파일명}          -- 업로드 원본
```
- 분석 결과는 Storage가 아닌 `analysis_results` JSONB에 저장 (요약만이므로 소용량)
- MVP 파일 크기 제한: 20MB (클라이언트 파싱 한계 가드)

## 7. 분석 엔진 구조 (`lib/analytics/`)

**전부 TypeScript 순수 함수 — AI·네트워크 의존 없음. 브라우저/서버 어디서나 동일 실행.**

```
lib/analytics/
  parser.ts           # CSV/XLSX → ParsedTable (papaparse, xlsx)
  schemaProfiler.ts   # 컬럼 타입 판별: 수치|범주|날짜|위경도|행정구역 (샘플링 기반 규칙)
  qualityChecker.ts   # 결측률·중복행·IQR 이상치 → 품질 점수(0~100) 산정식
  statsGenerator.ts   # 기초통계(평균·중앙값·표준편차·분위), 빈도표 상위 N, 피어슨 상관
  chartRecommender.ts # 규칙: 날짜+수치→선, 범주+수치→막대, 범주 비중→파이 (ChartSpec[])
  mapDetector.ts      # lat/lng·위도/경도 컬럼 or 시군구명 매칭 → MapSpec
  insightGenerator.ts # 계산 결과 → 규칙형 한국어 인사이트 문장 (템플릿 기반)
  index.ts            # runAnalysis(file, meta) → AnalysisResult 오케스트레이션
lib/ai/
  narrator.ts         # 요약 JSON만 입력받아 문장 다듬기 (Anthropic, 선택적)
  prompts.ts          # 보고서 초안·인사이트 문체 프롬프트
```

원칙:
- `runAnalysis`는 원자료를 받아 **요약 JSON(AnalysisResult)만 반환** — 이 JSON만 DB·AI로 전달
- `aiNarrator`는 `/api/narrate` 서버 라우트에서만 호출 (API 키 서버 보관), 실패·키 부재 시 규칙형 문장 폴백
- 데이터 유형(생활인구·카드매출 등)별 인사이트 템플릿은 `insightGenerator` 내 전략 테이블로 확장

향후 확장(제외 범위): 대용량·고급 통계는 Python 워커(Supabase Edge Function 또는 별도 서버)로 위임하는 인터페이스만 예약 (`AnalysisResult` 스키마 공유)

## 8. 컴포넌트 구조

```
app/
  layout.tsx                      # App Shell + Side Nav + 테마 CSS
  page.tsx                        # Landing
  dashboard/page.tsx
  upload/page.tsx
  projects/[id]/page.tsx          # Project Detail
  projects/[id]/analysis/page.tsx
  projects/[id]/report/page.tsx
  api/narrate/route.ts            # aiNarrator 서버 라우트 (유일한 AI 접점)
components/
  layout/   AppShell.tsx SideNav.tsx PageHeader.tsx
  dashboard/ KpiCard.tsx ProjectList.tsx StatusBadge.tsx
  upload/   FileDropzone.tsx UploadForm.tsx
  charts/   BarChart.tsx LineChart.tsx PieChart.tsx ChartRenderer.tsx  # ChartSpec → Recharts
  tables/   DataPreviewTable.tsx                                       # TanStack Table
  maps/     AnalysisMap.tsx                                            # MapLibre, MapSpec → 마커/단계구분도
  reports/  ReportPreview.tsx CopyButton.tsx
lib/
  supabase/ client.ts server.ts queries.ts demo-fallback.ts  # env 없으면 demo 모드 전환
  analytics/ (7절 참조)
  ai/        (7절 참조)
  utils/     format.ts
types/       analysis.ts project.ts
data/demo/   생활인구_샘플.csv 카드매출_샘플.csv demo-projects.ts(사전 계산 결과)
```

- 모든 주요 파일 최상단에 역할 주석 1~2줄
- 지도 컴포넌트는 `next/dynamic` + `ssr: false` (MapLibre SSR 불가)

## 9. 구현 단계

| 단계 | 내용 | 산출 확인 |
|---|---|---|
| 1 | 프로젝트 스캐폴딩: create-next-app + Astryx 설치 + App Shell 레이아웃 | `npm run dev` 기동, 공통 레이아웃 |
| 2 | 분석 엔진 코어: parser → profiler → quality → stats → recommender → detector → insight | 유닛 수준 스모크(샘플 CSV 통과) |
| 3 | 더미 데이터 + 데모 모드: `data/demo/` + `demo-fallback.ts` | env 없이 전 화면 데이터 표시 |
| 4 | 화면 구현: Landing → Dashboard → Upload → Detail → Analysis → Report | 전 화면 흐름 클릭 통과 |
| 5 | 차트·테이블·지도 통합: ChartRenderer, DataPreviewTable, AnalysisMap | 실제 렌더 확인 |
| 6 | Supabase 연동: 스키마 마이그레이션 + Storage 업로드 + CRUD | 업로드→저장→재조회 |
| 7 | AI narrator + Report 페이지: `/api/narrate`, 보고서 초안·복사 | 키 유무 양쪽 동작 |
| 8 | 마감: README, .env.example, 데모 시나리오, Vercel 배포 검증 | 배포 URL 기준 확인 |

각 단계 완료 시 빌드(`npm run build`) 통과 확인 후 다음 단계 진행.

## 10. MVP 범위 (포함)

- 6개 화면 전체 흐름 + Astryx 기반 UI
- CSV/XLSX 클라이언트 파싱·분석 (20MB 이하)
- 규칙형 분석 엔진 7개 모듈 전부 (기본 규칙 수준)
- Recharts 3종(막대·선·파이), TanStack Table 미리보기, MapLibre 지도(마커 + 시군구 표시)
- 데모 모드 (Supabase·AI 키 없이 동작)
- Supabase 스키마·Storage·CRUD 연동 구조
- AI narrator (요약 JSON만 전달, 폴백 내장)
- 보고서 초안 생성(분석요약·발견점·정책시사점·한계점) + Markdown 미리보기·복사

## 11. 제외 범위 (MVP 이후)

- 로그인/회원 관리 UI (Supabase Auth 구조만 준비, 익명 데모 우선)
- Python 고급 분석 워커 (시계열 분해·회귀·군집)
- 다중 파일 조인, 20MB 초과 대용량 스트리밍 처리
- 보고서 PDF/HWPX 내보내기
- 실시간 협업, 프로젝트 공유, 알림
- 행정구역 단계구분도 고도화(전국 경계 최적화) — MVP는 경남 중심 기본 표시

## 12. 데모 시나리오 (심사용)

1. Landing에서 서비스 정체성 확인("엔진이 계산, AI가 설명") → 시작하기
2. Upload에서 `생활인구_샘플.csv` 업로드, 유형=생활인구, 목적 입력 → 분석 실행
3. 수 초 내 Project Detail: 품질 점수·컬럼 타입·결측 요약 (AI 미개입 강조)
4. Analysis Dashboard: KPI·차트·테이블·지도 → AI 인사이트 패널에서 "요약 JSON만 전달" 구조 설명
5. Report: 정책 시사점 포함 초안 → 복사 버튼 시연
6. (선택) 네트워크 차단 후에도 데모 모드 동작 시연 → 자체 엔진 증명

## 13. 향후 확장 TODO

- [ ] Python 분석 워커 인터페이스 연결 (고급 통계·ML)
- [ ] 데이터 유형별 인사이트 템플릿 확충 (7종 전부)
- [ ] 행정구역 GeoJSON 단계구분도 (C:\업무\gis_resources 자산 활용)
- [ ] Supabase Auth 로그인 + RLS 사용자 격리 완성
- [ ] 보고서 HWPX/PPTX 내보내기 (기존 스킬 자산 연계)
- [ ] 분석 이력 버전 관리 (analysis_results 다중 버전 비교)
