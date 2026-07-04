# Policy Analytics Engine (정책 분석 엔진)

> "AI가 분석하는 서비스가 아니라, 분석 엔진이 계산하고 AI가 설명하는 공공데이터 분석 플랫폼"

공공·민간 데이터 파일(CSV/XLSX)을 업로드하면 자체 규칙형 분석 엔진이 EDA·품질진단·기초통계·
차트 추천·지도 감지·규칙형 인사이트를 계산하고, AI는 그 계산 결과(요약 JSON)만 전달받아
자연어 설명으로 다듬는 보조 역할만 수행한다. 자세한 화면·아키텍처 설계는 [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) 참고.

## 기술 스택

Next.js (App Router) + TypeScript · Astryx(`@astryxdesign/core`) · Recharts · TanStack Table ·
MapLibre GL JS · Lucide React · Supabase · Vercel

## 시작하기

```bash
npm install
cp .env.example .env.local   # 아래 환경변수 설정
npm run dev
```

http://localhost:3000 에서 확인한다.

## 환경변수

`.env.example` 참고. 모두 선택 사항이며, 비워두면 아래처럼 자동으로 대체 동작한다.

| 변수 | 미설정 시 동작 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 로컬(브라우저 저장소) 데모 모드로 전 화면 정상 동작 |
| `ANTHROPIC_API_KEY` | AI 설명 기능만 비활성화("AI 설명 기능은 아직 준비 중입니다" 안내), 규칙 기반 분석 결과는 그대로 표시 |

## 아키텍처 원칙: AI 단일 접점

AI 호출은 `app/api/narrate/route.ts` 단 하나의 라우트에서만 발생하며, 다음 두 가지로 구조적으로 보장한다.

1. 클라이언트는 원본 데이터 행이 아니라 `lib/analytics`가 계산한 요약 통계(`NarratorInput`, [`types/analysis.ts`](./types/analysis.ts))만 서버로 보낸다.
2. 서버 라우트는 요청 본문을 그대로 AI에 전달하지 않고, 문서화된 필드만 화이트리스트로 골라 재조립한 뒤 전달한다(`pickNarratorInput`) — 클라이언트가 무엇을 보내든 원본 행 데이터가 AI 호출에 섞일 수 없다.

## 검증

```bash
npx tsc --noEmit   # 타입 검사
npm run build      # 프로덕션 빌드
```
