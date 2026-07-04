# Post-MVP 보강 작업 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 정책 분석 엔진 MVP 배포 후, 실사용 검증·공유/내보내기·엔진 신뢰성 테스트 3개 독립 트랙을 완료한다.

**Architecture:** 트랙 1은 코드 변경 없는 수동 스모크 테스트, 트랙 2는 `ReportView.tsx`에 버튼 2개 + `globals.css`에 `@media print` 규칙 추가, 트랙 3은 Vitest를 신규 도입해 `lib/analytics`의 순수 함수 6개에 대한 단위 테스트를 작성한다. 세 트랙은 서로 의존하지 않으며 어느 순서로도 진행 가능하다.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, `@astryxdesign/core`, Vitest(신규), papaparse.

---

## Track 1: 실사용 검증 (E2E 스모크 테스트, 코드 변경 없음)

### Task 1: Production 사이트 4단계 스모크 테스트 수행 및 기록

**Files:**
- Create: `docs/superpowers/verification/2026-07-04-e2e-smoke-test.md`

이 트랙은 코드를 작성하지 않는다 — 사람이 직접 브라우저로 검증하고 그 결과를 기록한다. (참고: 이번 세션에서 sample-data 4종 CSV(`sample-data/*.csv`)로 `lib/analytics` 엔진 자체는 이미 로컬 실행(`scripts/verify-engine-samples.ts`)으로 검증 완료 — 이 트랙은 그 위에 실제 배포 사이트의 업로드→분석→AI설명→리포트저장 전체 플로우가 동작하는지 확인하는 것이 목적이다.)

- [ ] **Step 1: 결과 기록 파일 뼈대 작성**

```markdown
# E2E 스모크 테스트 결과 (2026-07-04)

## 절차 및 결과

| 단계 | 절차 | 결과 | 비고 |
|---|---|---|---|
| 1 | https://policy-analytics-engine.vercel.app 에서 프로젝트 생성 | [ ] PASS / [ ] FAIL | |
| 2 | sample-data/budget-by-region.csv 업로드 → EDA/품질진단/차트 확인 | [ ] PASS / [ ] FAIL | |
| 3 | AI 설명 요청 → Qwen 실제 응답 확인 (폴백 문구 아님) | [ ] PASS / [ ] FAIL | |
| 4 | 리포트 생성 → 새로고침 후에도 Supabase에 유지되는지 확인 | [ ] PASS / [ ] FAIL | |

## 발견된 이슈
(있으면 기록, 없으면 "없음")
```

이 템플릿 파일을 위 경로에 그대로 생성한다.

- [ ] **Step 2: 브라우저로 4단계 직접 수행**

`https://policy-analytics-engine.vercel.app` 접속 → 프로젝트 생성 → `sample-data/budget-by-region.csv` 업로드(결측치·회계연도 반복 값 포함 데이터라 EDA/품질진단 화면 검증에 적합) → AI 설명 요청 → 리포트 생성 → 브라우저 새로고침 후 리포트 유지 확인.

- [ ] **Step 3: 결과를 Step 1 파일에 기록**

각 단계 PASS/FAIL 표시. FAIL이 있으면 "발견된 이슈"에 재현 절차와 함께 기록.

- [ ] **Step 4: 이슈 발견 시 별도 트랙으로 분리**

Step 3에서 이슈가 발견되면 이 플랜에 추가하지 않는다 — 별도 버그 수정 작업으로 분리해 원인 파악 후 처리한다(가상 시나리오를 미리 만들지 않는다는 설계 문서 원칙).

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/verification/2026-07-04-e2e-smoke-test.md
git commit -m "docs: record production E2E smoke test results"
```

---

## Track 2: 공유 링크 + 리포트 PDF 내보내기

### Task 2: ReportView에 "링크 복사"/"PDF로 내보내기" 버튼 추가

**Files:**
- Modify: `components/report/ReportView.tsx`

- [ ] **Step 1: "링크 복사" 핸들러 추가**

`components/report/ReportView.tsx`의 `handleCopy` 함수 아래(11번째 줄 `handleCopy` 정의 직후)에 추가:

```typescript
  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href);
    toast({ body: "공유 링크가 복사되었습니다" });
  }

  function handleExportPdf() {
    window.print();
  }
```

- [ ] **Step 2: 버튼 UI 추가**

기존 버튼 영역(`<div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 16 }}>` 내부, `복사`/`리포트 저장` 버튼이 있는 곳)을 아래로 교체:

```tsx
        <div
          className="no-print"
          style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 16 }}
        >
          <Button label="링크 복사" onClick={handleCopyLink} />
          <Button label="PDF로 내보내기" onClick={handleExportPdf} />
          <Button label="복사" onClick={handleCopy} />
          <Button label="리포트 저장" variant="primary" isLoading={isSaving} clickAction={handleSave} />
        </div>
```

- [ ] **Step 3: 타입 체크**

Run: `cd C:\업무\분석툴 && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: 개발 서버에서 수동 확인**

Run: `npm run dev` → 임의 프로젝트의 리포트 화면 접속 → "링크 복사" 클릭 시 토스트 "공유 링크가 복사되었습니다" 표시 확인 → "PDF로 내보내기" 클릭 시 브라우저 인쇄 대화상자가 열리는지 확인.

- [ ] **Step 5: Commit**

```bash
git add components/report/ReportView.tsx
git commit -m "feat: add share-link copy and PDF export buttons to report view"
```

### Task 3: 인쇄 전용 스타일 추가

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: `@media print` 규칙 추가**

`app/globals.css` 파일 끝(현재 17번째 줄 `}` 다음)에 추가:

```css
@media print {
  .no-print {
    display: none !important;
  }

  body {
    background: #fff;
    color: #000;
  }
}
```

- [ ] **Step 2: 인쇄 미리보기로 확인**

`npm run dev` 실행 중인 상태에서 리포트 화면 → 브라우저 인쇄 미리보기(Ctrl+P) 열기 → "링크 복사"/"PDF로 내보내기"/"복사"/"리포트 저장" 버튼 4개가 미리보기에서 보이지 않는지 확인 (Task 2의 `no-print` 클래스가 버튼 감싸는 `div` 전체에 적용되어 있으므로 4개 모두 숨겨져야 정상).

- [ ] **Step 3: 빌드 확인**

Run: `cd C:\업무\분석툴 && npm run build`
Expected: 빌드 성공, CSS 관련 에러 없음.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "style: add print-only CSS rules for PDF export"
```

---

## Track 3: 품질 보강 — `lib/analytics` 단위 테스트 (Vitest 신규 도입)

### Task 4: Vitest 설치 및 설정

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: devDependency 설치**

Run: `cd C:\업무\분석툴 && npm install -D vitest @vitejs/plugin-react`
Expected: `package.json`의 `devDependencies`에 `vitest`, `@vitejs/plugin-react` 추가됨.

- [ ] **Step 2: `vitest.config.ts` 작성**

```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

- [ ] **Step 3: `package.json`에 `test` 스크립트 추가**

`scripts` 항목에 추가:

```json
    "test": "vitest run"
```

- [ ] **Step 4: 설정 확인용 더미 테스트로 동작 검증**

`lib/analytics/__setup.test.ts` 임시 생성:

```typescript
import { describe, it, expect } from "vitest";

describe("vitest setup", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm test`
Expected: PASS 1개.

이후 이 임시 파일은 삭제한다 (`lib/analytics/__setup.test.ts` 제거) — Task 5~9에서 실제 테스트 파일들이 이를 대체한다.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add Vitest for lib/analytics unit tests"
```

### Task 5: `schemaProfiler.ts` 단위 테스트

**Files:**
- Create: `lib/analytics/schemaProfiler.test.ts`

`profileSchema`는 컬럼별 표본값에서 타입(`numeric`/`categorical`/`date`/`boolean`/`text`)을 추정한다 (`lib/analytics/schemaProfiler.ts:7-24`의 `inferColumnType` 규칙: 숫자 비율 80%↑→numeric, 전부 boolean 어휘집합에 속하면→boolean, 날짜 정규식 매치 80%↑→date, 고유값 비율 50%↓→categorical, 그 외→text).

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
import { describe, it, expect } from "vitest";
import { profileSchema } from "./schemaProfiler";
import type { ParsedDataset } from "@/types/analysis";

describe("profileSchema", () => {
  it("infers numeric, categorical, date, boolean, text types correctly", () => {
    const dataset: ParsedDataset = {
      columns: ["금액", "지역", "날짜", "동의여부", "의견"],
      rows: [
        { 금액: 100, 지역: "창원시", 날짜: "2025-01", 동의여부: "예", 의견: "좋아요1" },
        { 금액: 200, 지역: "창원시", 날짜: "2025-02", 동의여부: "아니오", 의견: "좋아요2" },
        { 금액: 300, 지역: "진주시", 날짜: "2025-03", 동의여부: "예", 의견: "좋아요3" },
        { 금액: 400, 지역: "창원시", 날짜: "2025-04", 동의여부: "예", 의견: "좋아요4" },
      ],
    };

    const result = profileSchema(dataset);

    expect(result.rowCount).toBe(4);
    expect(result.columnCount).toBe(5);
    const typeByName = Object.fromEntries(result.columns.map((c) => [c.name, c.type]));
    expect(typeByName["금액"]).toBe("numeric");
    expect(typeByName["지역"]).toBe("categorical");
    expect(typeByName["날짜"]).toBe("date");
    expect(typeByName["동의여부"]).toBe("boolean");
    expect(typeByName["의견"]).toBe("text");
  });

  it("returns text type for an all-null column", () => {
    const dataset: ParsedDataset = {
      columns: ["빈컬럼"],
      rows: [{ 빈컬럼: null }, { 빈컬럼: null }],
    };

    const result = profileSchema(dataset);

    expect(result.columns[0].type).toBe("text");
    expect(result.columns[0].sampleValues).toEqual([]);
  });

  it("handles an empty dataset (zero rows)", () => {
    const dataset: ParsedDataset = { columns: ["a", "b"], rows: [] };

    const result = profileSchema(dataset);

    expect(result.rowCount).toBe(0);
    expect(result.columnCount).toBe(2);
    expect(result.columns[0].type).toBe("text");
  });
});
```

- [ ] **Step 2: 테스트 실행 확인**

Run: `cd C:\업무\분석툴 && npx vitest run lib/analytics/schemaProfiler.test.ts`
Expected: PASS 3개 (이미 구현이 존재하므로 첫 실행부터 통과해야 함 — 이 트랙은 기존 코드에 대한 회귀 방지 테스트 추가이지 TDD 신규 구현이 아니다).

- [ ] **Step 3: Commit**

```bash
git add lib/analytics/schemaProfiler.test.ts
git commit -m "test: add unit tests for profileSchema"
```

### Task 6: `qualityChecker.ts` 단위 테스트

**Files:**
- Create: `lib/analytics/qualityChecker.test.ts`

`checkQuality`는 컬럼별 결측 개수/비율과 중복행 수를 계산하고(`lib/analytics/qualityChecker.ts:4-38`), `computeQualityScore`는 결측률×60 + 중복률×30 + (행수<10이면 20, <30이면 10) 페널티를 100에서 뺀 값을 0~100 범위로 clamp한다(`lib/analytics/qualityChecker.ts:40-51`).

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
import { describe, it, expect } from "vitest";
import { checkQuality, computeQualityScore } from "./qualityChecker";
import { profileSchema } from "./schemaProfiler";
import type { ParsedDataset } from "@/types/analysis";

describe("checkQuality", () => {
  it("counts missing cells per column and overall", () => {
    const dataset: ParsedDataset = {
      columns: ["a", "b"],
      rows: [
        { a: 1, b: null },
        { a: null, b: 2 },
        { a: 3, b: 4 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = checkQuality(dataset, schema);

    expect(result.totalCells).toBe(6);
    expect(result.totalMissingCells).toBe(2);
    expect(result.overallMissingRate).toBeCloseTo(2 / 6);
    const missingByCol = Object.fromEntries(result.columns.map((c) => [c.name, c.missingCount]));
    expect(missingByCol["a"]).toBe(1);
    expect(missingByCol["b"]).toBe(1);
  });

  it("detects duplicate rows by full-row signature", () => {
    const dataset: ParsedDataset = {
      columns: ["a", "b"],
      rows: [
        { a: 1, b: 2 },
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = checkQuality(dataset, schema);

    expect(result.duplicateRowCount).toBe(1);
  });

  it("returns zero rates for an empty dataset without dividing by zero", () => {
    const dataset: ParsedDataset = { columns: ["a"], rows: [] };
    const schema = profileSchema(dataset);

    const result = checkQuality(dataset, schema);

    expect(result.totalCells).toBe(0);
    expect(result.overallMissingRate).toBe(0);
  });
});

describe("computeQualityScore", () => {
  it("returns 100 for a large, complete, duplicate-free dataset", () => {
    const missingSummary = {
      totalCells: 300,
      totalMissingCells: 0,
      overallMissingRate: 0,
      duplicateRowCount: 0,
      columns: [],
    };

    expect(computeQualityScore(missingSummary, 30)).toBe(100);
  });

  it("applies the small-volume penalty for datasets under 10 rows", () => {
    const missingSummary = {
      totalCells: 50,
      totalMissingCells: 0,
      overallMissingRate: 0,
      duplicateRowCount: 0,
      columns: [],
    };

    expect(computeQualityScore(missingSummary, 5)).toBe(80);
  });

  it("clamps the score at 0 for very poor quality data", () => {
    const missingSummary = {
      totalCells: 10,
      totalMissingCells: 9,
      overallMissingRate: 0.9,
      duplicateRowCount: 5,
      columns: [],
    };

    expect(computeQualityScore(missingSummary, 5)).toBe(0);
  });
});
```

- [ ] **Step 2: 테스트 실행 확인**

Run: `cd C:\업무\분석툴 && npx vitest run lib/analytics/qualityChecker.test.ts`
Expected: PASS 6개.

- [ ] **Step 3: Commit**

```bash
git add lib/analytics/qualityChecker.test.ts
git commit -m "test: add unit tests for checkQuality and computeQualityScore"
```

### Task 7: `statsGenerator.ts` 단위 테스트

**Files:**
- Create: `lib/analytics/statsGenerator.test.ts`

`generateNumericSummary`는 numeric 컬럼별 평균/표준편차/최소/최대/중앙값/사분위수를 계산하고(`lib/analytics/statsGenerator.ts:20-51`), `generateCategoricalSummary`는 categorical/boolean 컬럼별 상위 8개 값의 빈도·비율을 계산한다(`lib/analytics/statsGenerator.ts:53-87`).

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
import { describe, it, expect } from "vitest";
import { generateNumericSummary, generateCategoricalSummary } from "./statsGenerator";
import { profileSchema } from "./schemaProfiler";
import type { ParsedDataset } from "@/types/analysis";

describe("generateNumericSummary", () => {
  it("computes mean, min, max, median for a numeric column", () => {
    const dataset: ParsedDataset = {
      columns: ["점수"],
      rows: [{ 점수: 1 }, { 점수: 2 }, { 점수: 3 }, { 점수: 4 }, { 점수: 5 }],
    };
    const schema = profileSchema(dataset);

    const result = generateNumericSummary(dataset, schema);

    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(5);
    expect(result[0].mean).toBe(3);
    expect(result[0].min).toBe(1);
    expect(result[0].max).toBe(5);
    expect(result[0].median).toBe(3);
  });

  it("ignores null values when computing statistics", () => {
    const dataset: ParsedDataset = {
      columns: ["점수"],
      rows: [{ 점수: 10 }, { 점수: null }, { 점수: 20 }],
    };
    const schema = profileSchema(dataset);

    const result = generateNumericSummary(dataset, schema);

    expect(result[0].count).toBe(2);
    expect(result[0].mean).toBe(15);
  });

  it("returns an empty array when there are no numeric columns", () => {
    const dataset: ParsedDataset = {
      columns: ["이름"],
      rows: [{ 이름: "가" }, { 이름: "나" }, { 이름: "가" }],
    };
    const schema = profileSchema(dataset);

    const result = generateNumericSummary(dataset, schema);

    expect(result).toEqual([]);
  });
});

describe("generateCategoricalSummary", () => {
  it("ranks top values by frequency with correct ratio", () => {
    const dataset: ParsedDataset = {
      columns: ["지역"],
      rows: [
        { 지역: "창원시" },
        { 지역: "창원시" },
        { 지역: "진주시" },
        { 지역: "창원시" },
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateCategoricalSummary(dataset, schema);

    expect(result).toHaveLength(1);
    expect(result[0].uniqueCount).toBe(2);
    expect(result[0].topValues[0]).toEqual({ value: "창원시", count: 3, ratio: 0.75 });
  });

  it("excludes null values from the present-count denominator", () => {
    const dataset: ParsedDataset = {
      columns: ["지역"],
      rows: [{ 지역: "창원시" }, { 지역: null }, { 지역: "창원시" }],
    };
    const schema = profileSchema(dataset);

    const result = generateCategoricalSummary(dataset, schema);

    expect(result[0].topValues[0].ratio).toBe(1);
  });
});
```

- [ ] **Step 2: 테스트 실행 확인**

Run: `cd C:\업무\분석툴 && npx vitest run lib/analytics/statsGenerator.test.ts`
Expected: PASS 5개.

- [ ] **Step 3: Commit**

```bash
git add lib/analytics/statsGenerator.test.ts
git commit -m "test: add unit tests for numeric and categorical summary generators"
```

### Task 8: `chartRecommender.ts` / `mapDetector.ts` 단위 테스트

**Files:**
- Create: `lib/analytics/chartRecommender.test.ts`
- Create: `lib/analytics/mapDetector.test.ts`

- [ ] **Step 1: `chartRecommender.test.ts` 작성**

```typescript
import { describe, it, expect } from "vitest";
import { recommendCharts } from "./chartRecommender";
import { profileSchema } from "./schemaProfiler";
import { generateNumericSummary, generateCategoricalSummary } from "./statsGenerator";
import type { ParsedDataset } from "@/types/analysis";

describe("recommendCharts", () => {
  it("recommends a line chart when a date column and numeric column exist", () => {
    const dataset: ParsedDataset = {
      columns: ["날짜", "인구수"],
      rows: [
        { 날짜: "2025-01", 인구수: 100 },
        { 날짜: "2025-02", 인구수: 110 },
      ],
    };
    const schema = profileSchema(dataset);
    const numericSummary = generateNumericSummary(dataset, schema);
    const categoricalSummary = generateCategoricalSummary(dataset, schema);

    const result = recommendCharts(dataset, schema, numericSummary, categoricalSummary);

    expect(result.some((c) => c.type === "line")).toBe(true);
  });

  it("recommends bar and pie charts for a categorical column", () => {
    const dataset: ParsedDataset = {
      columns: ["지역", "인구수"],
      rows: [
        { 지역: "창원시", 인구수: 100 },
        { 지역: "진주시", 인구수: 200 },
      ],
    };
    const schema = profileSchema(dataset);
    const numericSummary = generateNumericSummary(dataset, schema);
    const categoricalSummary = generateCategoricalSummary(dataset, schema);

    const result = recommendCharts(dataset, schema, numericSummary, categoricalSummary);

    expect(result.some((c) => c.type === "bar")).toBe(true);
    expect(result.some((c) => c.type === "pie")).toBe(true);
  });

  it("returns an empty array when there is no numeric or categorical column", () => {
    const dataset: ParsedDataset = {
      columns: ["의견"],
      rows: [{ 의견: "좋아요" }, { 의견: "별로예요" }],
    };
    const schema = profileSchema(dataset);
    const numericSummary = generateNumericSummary(dataset, schema);
    const categoricalSummary = generateCategoricalSummary(dataset, schema);

    const result = recommendCharts(dataset, schema, numericSummary, categoricalSummary);

    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: `mapDetector.test.ts` 작성**

```typescript
import { describe, it, expect } from "vitest";
import { detectMap } from "./mapDetector";
import { profileSchema } from "./schemaProfiler";
import type { ParsedDataset } from "@/types/analysis";

describe("detectMap", () => {
  it("detects point mode when latitude/longitude columns exist", () => {
    const dataset: ParsedDataset = {
      columns: ["시설명", "위도", "경도"],
      rows: [
        { 시설명: "창원시청", 위도: 35.228, 경도: 128.6811 },
        { 시설명: "진주시청", 위도: 35.18, 경도: 128.1076 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = detectMap(dataset, schema);

    expect(result.detected).toBe(true);
    expect(result.mode).toBe("point");
    expect(result.points).toHaveLength(2);
  });

  it("detects region mode when a region-name column exists without coordinates", () => {
    const dataset: ParsedDataset = {
      columns: ["시군구", "값"],
      rows: [
        { 시군구: "창원시", 값: 1 },
        { 시군구: "진주시", 값: 2 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = detectMap(dataset, schema);

    expect(result.detected).toBe(true);
    expect(result.mode).toBe("region");
  });

  it("returns detected=false when no geo-related column exists", () => {
    const dataset: ParsedDataset = {
      columns: ["항목", "값"],
      rows: [{ 항목: "A", 값: 1 }],
    };
    const schema = profileSchema(dataset);

    const result = detectMap(dataset, schema);

    expect(result.detected).toBe(false);
    expect(result.mode).toBe("none");
  });
});
```

- [ ] **Step 3: 테스트 실행 확인**

Run: `cd C:\업무\분석툴 && npx vitest run lib/analytics/chartRecommender.test.ts lib/analytics/mapDetector.test.ts`
Expected: PASS 6개.

- [ ] **Step 4: Commit**

```bash
git add lib/analytics/chartRecommender.test.ts lib/analytics/mapDetector.test.ts
git commit -m "test: add unit tests for chart recommendation and map detection"
```

### Task 9: 전체 테스트 스위트 + 빌드 최종 확인

**Files:**
- 없음 (검증만 수행)

- [ ] **Step 1: 임시 설정 테스트 파일 제거 확인**

Task 4 Step 4에서 만든 `lib/analytics/__setup.test.ts`가 삭제되어 있는지 확인 (`ls lib/analytics/*.test.ts`로 5개 파일만 남아있어야 함: schemaProfiler, qualityChecker, statsGenerator, chartRecommender, mapDetector).

- [ ] **Step 2: 전체 테스트 실행**

Run: `cd C:\업무\분석툴 && npm test`
Expected: 전체 PASS (Task 5~8 합계 20개 테스트).

- [ ] **Step 3: 빌드 클린 확인**

Run: `cd C:\업무\분석툴 && npm run build`
Expected: 빌드 성공, 타입 에러 없음.

- [ ] **Step 4: Commit (필요 시)**

Step 1에서 임시 파일 삭제가 아직 반영 안 됐다면:

```bash
git rm lib/analytics/__setup.test.ts
git commit -m "chore: remove Vitest setup verification file"
```

---

## 완료 기준 (설계 문서 기준 재확인)

- 트랙 1: `docs/superpowers/verification/2026-07-04-e2e-smoke-test.md`에 4단계 PASS 기록.
- 트랙 2: "링크 복사"/"PDF로 내보내기" 버튼 동작, `npx tsc --noEmit` + `npm run build` 클린.
- 트랙 3: `lib/analytics`의 6개 함수 모듈(schemaProfiler, qualityChecker, statsGenerator×2, chartRecommender, mapDetector)에 대한 Vitest 테스트 전체 그린, `npm run build` 클린.
