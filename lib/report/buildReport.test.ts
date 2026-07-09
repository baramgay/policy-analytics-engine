import { describe, expect, it } from "vitest";
import { buildReportMarkdown } from "@/lib/report/buildReport";
import type { AnalysisResult, ProjectMeta } from "@/types/analysis";

function buildBaseMeta(): ProjectMeta {
  return {
    id: "project-1",
    title: "테스트 프로젝트",
    description: "설명",
    dataType: "카드매출",
    analysisGoal: "지역별 매출 추이 파악",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function buildBaseAnalysis(): AnalysisResult {
  return {
    qualityScore: 92,
    schemaSummary: {
      rowCount: 100,
      columnCount: 2,
      columns: [
        { name: "금액", type: "numeric", sampleValues: [1000, 2000] },
        { name: "지역", type: "categorical", sampleValues: ["창원시", "김해시"] },
      ],
    },
    missingSummary: {
      totalCells: 200,
      totalMissingCells: 0,
      overallMissingRate: 0,
      duplicateRowCount: 0,
      columns: [],
    },
    numericSummary: [
      { column: "금액", count: 100, mean: 1500, std: 200, min: 1000, max: 2000, median: 1500, q1: 1200, q3: 1800 },
    ],
    categoricalSummary: [
      { column: "지역", uniqueCount: 2, topValues: [{ value: "창원시", count: 60, ratio: 0.6 }] },
    ],
    chartSpecs: [],
    mapSpecs: { detected: false, mode: "none", points: [] },
    insightSummary: "규칙 기반 인사이트 본문입니다.",
    generatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("buildReportMarkdown", () => {
  it("includes all six conditional sections when their data is provided", () => {
    const analysis: AnalysisResult = {
      ...buildBaseAnalysis(),
      correlationSummary: [
        {
          columnA: "금액",
          columnB: "방문자수",
          coefficient: 0.35,
          strength: "보통",
          pValue: 0.0021,
          significant: true,
          interpretation: "상관계수 0.35, p=0.0021로 통계적으로 유의한 보통 양의 상관관계",
        },
      ],
      categoricalCorrelationSummary: [
        {
          columnA: "지역",
          columnB: "요일",
          chiSquare: 12.5,
          pValue: 0.01,
          significant: true,
          cramersV: 0.3,
          reliable: true,
          interpretation: "카이제곱=12.50, p=0.0100로 통계적으로 유의한 연관성(Cramér's V=0.3)",
        },
        {
          columnA: "지역",
          columnB: "결제수단",
          chiSquare: 3.1,
          pValue: 0.2,
          significant: false,
          cramersV: 0.1,
          reliable: false,
          interpretation: "표본이 작아 참고용",
        },
      ],
      vifSummary: [
        { column: "금액", vif: 12.3, concern: true },
        { column: "방문자수", vif: 2.1, concern: false },
      ],
      groupComparisonSummary: [
        {
          groupColumn: "지역",
          numericColumn: "금액",
          method: "welch-t",
          groupCount: 2,
          statistic: 2.5,
          pValue: 0.02,
          significant: true,
          groupMeans: [
            { group: "창원시", mean: 1600, count: 60, sd: 180 },
            { group: "김해시", mean: 1300, count: 40, sd: 210 },
          ],
          effectSize: { type: "cohen_d", value: 0.45, magnitude: "중간" },
          interpretation: "p=0.0200로 유의하며 효과크기(d=0.45)도 중간",
        },
      ],
      outlierSummary: [
        {
          column: "금액",
          lowerBound: 800,
          upperBound: 2200,
          outlierCount: 5,
          outlierIndices: [1, 2, 3, 4, 5],
          highConfidenceIndices: [1, 2, 3],
          referenceIndices: [4, 5],
        },
        {
          column: "방문자수",
          lowerBound: 0,
          upperBound: 100,
          outlierCount: 0,
          outlierIndices: [],
          highConfidenceIndices: [],
          referenceIndices: [],
        },
      ],
      timeSeriesSummary: [
        {
          dateColumn: "일자",
          numericColumn: "금액",
          trendSlope: 1.2,
          trendIntercept: 100,
          trendDirection: "증가",
          points: [],
          momChange: 5.2,
          yoyChange: null,
        },
      ],
    };

    const markdown = buildReportMarkdown(buildBaseMeta(), analysis);

    expect(markdown).toContain("## 상관 검정");
    expect(markdown).toContain("## 범주형 변수 연관성");
    expect(markdown).toContain("## 다중공선성 진단");
    expect(markdown).toContain("## 그룹 차이 검정");
    expect(markdown).toContain("## 이상치 탐지");
    expect(markdown).toContain("## 시계열 동향");

    expect(markdown).toContain("p=");
    expect(markdown).toContain("효과크기");
    expect(markdown).toContain("고신뢰");

    expect(markdown).toContain("회귀 분석 시 해당 변수들의 동시 투입에 주의가 필요합니다.");
    expect(markdown).not.toContain("방문자수: VIF");
    expect(markdown).not.toContain("**방문자수**: 고신뢰");
    expect(markdown).toContain("고신뢰 이상치 3건, 참고 수준 2건 (정상 범위 800 ~ 2200)");
    expect(markdown).toContain("전월대비 +5.2%");
    expect(markdown).toContain("전년동월대비 산출 불가");
    expect(markdown).toContain("표본이 작아 참고용");
  });

  it("omits all conditional sections when no optional fields are provided", () => {
    const markdown = buildReportMarkdown(buildBaseMeta(), buildBaseAnalysis());

    expect(markdown).not.toContain("## 상관 검정");
    expect(markdown).not.toContain("## 범주형 변수 연관성");
    expect(markdown).not.toContain("## 다중공선성 진단");
    expect(markdown).not.toContain("## 그룹 차이 검정");
    expect(markdown).not.toContain("## 이상치 탐지");
    expect(markdown).not.toContain("## 시계열 동향");
    expect(markdown).toContain("## 규칙 기반 종합 인사이트");
  });

  it("omits the correlation section when no pair is significant", () => {
    const analysis: AnalysisResult = {
      ...buildBaseAnalysis(),
      correlationSummary: [
        {
          columnA: "금액",
          columnB: "방문자수",
          coefficient: 0.05,
          strength: "거의 없음",
          pValue: 0.8,
          significant: false,
          interpretation: "상관계수 0.05, p=0.8000로 통계적으로 유의하지 않음",
        },
      ],
    };

    const markdown = buildReportMarkdown(buildBaseMeta(), analysis);

    expect(markdown).not.toContain("## 상관 검정");
  });

  it("omits the outlier section when every column has zero outliers", () => {
    const analysis: AnalysisResult = {
      ...buildBaseAnalysis(),
      outlierSummary: [
        {
          column: "금액",
          lowerBound: 800,
          upperBound: 2200,
          outlierCount: 0,
          outlierIndices: [],
          highConfidenceIndices: [],
          referenceIndices: [],
        },
      ],
    };

    const markdown = buildReportMarkdown(buildBaseMeta(), analysis);

    expect(markdown).not.toContain("## 이상치 탐지");
  });
});
