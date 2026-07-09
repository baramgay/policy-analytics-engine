import { describe, expect, it } from "vitest";
import { buildReportHtml } from "@/lib/report/exportHtml";
import type { AnalysisResult, ProjectMeta } from "@/types/analysis";

function buildFixture(): { meta: ProjectMeta; analysis: AnalysisResult } {
  const meta: ProjectMeta = {
    id: "project-1",
    title: "경남 카드매출 리포트",
    description: "테스트용 프로젝트",
    dataType: "카드매출",
    analysisGoal: "지역별 소비 패턴 파악",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };

  const analysis: AnalysisResult = {
    qualityScore: 88,
    schemaSummary: {
      rowCount: 1200,
      columnCount: 4,
      columns: [
        { name: "지역", type: "categorical", sampleValues: ["창원", "김해"] },
        { name: "매출액", type: "numeric", sampleValues: [10000, 20000] },
      ],
    },
    missingSummary: {
      totalCells: 4800,
      totalMissingCells: 48,
      overallMissingRate: 0.01,
      duplicateRowCount: 3,
      columns: [{ name: "지역", missingCount: 48, missingRate: 0.04 }],
    },
    numericSummary: [
      {
        column: "매출액",
        count: 1200,
        mean: 15000.5,
        std: 2300.25,
        min: 1000,
        max: 90000,
        median: 14000,
        q1: 8000,
        q3: 20000,
      },
    ],
    categoricalSummary: [
      {
        column: "지역",
        uniqueCount: 5,
        topValues: [
          { value: "창원", count: 500, ratio: 0.42 },
          { value: "김해", count: 300, ratio: 0.25 },
        ],
      },
    ],
    chartSpecs: [],
    mapSpecs: { detected: false, mode: "none", points: [] },
    insightSummary: "창원 지역의 매출 비중이 가장 높습니다.",
    generatedAt: "2026-07-05T09:00:00.000Z",
  };

  return { meta, analysis };
}

describe("buildReportHtml", () => {
  it("includes the project title as a document heading", () => {
    const { meta, analysis } = buildFixture();
    const html = buildReportHtml(meta, analysis);

    expect(html).toContain("<title>경남 카드매출 리포트 리포트</title>");
    expect(html).toContain("<h1>경남 카드매출 리포트</h1>");
  });

  it("includes summary statistics for the dataset", () => {
    const { meta, analysis } = buildFixture();
    const html = buildReportHtml(meta, analysis);

    expect(html).toContain("1,200");
    expect(html).toContain("88점");
    expect(html).toContain("15000.50");
  });

  it("includes the categorical top-value distribution", () => {
    const { meta, analysis } = buildFixture();
    const html = buildReportHtml(meta, analysis);

    expect(html).toContain("창원");
    expect(html).toContain("42%");
  });

  it("includes the rule-based insight summary", () => {
    const { meta, analysis } = buildFixture();
    const html = buildReportHtml(meta, analysis);

    expect(html).toContain("창원 지역의 매출 비중이 가장 높습니다.");
  });

  it("is a full standalone HTML document", () => {
    const { meta, analysis } = buildFixture();
    const html = buildReportHtml(meta, analysis);

    expect(html.trim().startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("<html lang=\"ko\">");
    expect(html).toContain("</html>");
  });

  it("does not reference any external CDN, font, or script resources", () => {
    const { meta, analysis } = buildFixture();
    const html = buildReportHtml(meta, analysis);

    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<link/i);
    expect(html).not.toContain("fonts.googleapis.com");
  });

  it("escapes HTML special characters in user-provided text", () => {
    const { meta, analysis } = buildFixture();
    const unsafeMeta: ProjectMeta = { ...meta, title: "<script>alert('x')</script>" };
    const html = buildReportHtml(unsafeMeta, analysis);

    expect(html).not.toContain("<script>alert('x')</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("omits empty sections when summaries are absent", () => {
    const { meta, analysis } = buildFixture();
    const emptyAnalysis: AnalysisResult = { ...analysis, numericSummary: [], categoricalSummary: [] };
    const html = buildReportHtml(meta, emptyAnalysis);

    expect(html).not.toContain("수치형 변수 통계");
    expect(html).not.toContain("범주형 변수 통계");
  });

  describe("optional statistical sections", () => {
    function buildEnrichedAnalysis(): AnalysisResult {
      const { analysis } = buildFixture();
      return {
        ...analysis,
        correlationSummary: [
          {
            columnA: "매출액",
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
        ],
        vifSummary: [
          { column: "매출액", vif: 12.3, concern: true },
          { column: "방문자수", vif: 2.1, concern: false },
        ],
        groupComparisonSummary: [
          {
            groupColumn: "지역",
            numericColumn: "매출액",
            method: "welch-t",
            groupCount: 2,
            statistic: 2.5,
            pValue: 0.02,
            significant: true,
            groupMeans: [
              { group: "창원", mean: 1600, count: 60, sd: 180 },
              { group: "김해", mean: 1300, count: 40, sd: 210 },
            ],
            effectSize: { type: "cohen_d", value: 0.45, magnitude: "중간" },
            interpretation: "p=0.0200로 유의하며 효과크기(d=0.45)도 중간",
          },
        ],
        outlierSummary: [
          {
            column: "매출액",
            lowerBound: 800,
            upperBound: 2200,
            outlierCount: 5,
            outlierIndices: [1, 2, 3, 4, 5],
            highConfidenceIndices: [1, 2, 3],
            referenceIndices: [4, 5],
          },
        ],
        timeSeriesSummary: [
          {
            dateColumn: "일자",
            numericColumn: "매출액",
            trendSlope: 1.2,
            trendIntercept: 100,
            trendDirection: "증가",
            points: [],
            momChange: 5.2,
            yoyChange: null,
          },
        ],
      };
    }

    it("renders all six optional sections when their data is present", () => {
      const { meta } = buildFixture();
      const html = buildReportHtml(meta, buildEnrichedAnalysis());

      expect(html).toContain("<h2>상관 검정</h2>");
      expect(html).toContain("<h2>범주형 변수 연관성</h2>");
      expect(html).toContain("<h2>다중공선성 진단</h2>");
      expect(html).toContain("<h2>그룹 차이 검정</h2>");
      expect(html).toContain("<h2>이상치 탐지</h2>");
      expect(html).toContain("<h2>시계열 동향</h2>");

      expect(html).toContain("회귀 분석 시 해당 변수들의 동시 투입에 주의가 필요합니다.");
      expect(html).toContain("3건");
      expect(html).toContain("2건");
      expect(html).toContain("+5.2%");
      expect(html).toContain("산출 불가");
    });

    it("omits all six optional sections when their data is absent", () => {
      const { meta, analysis } = buildFixture();
      const html = buildReportHtml(meta, analysis);

      expect(html).not.toContain("<h2>상관 검정</h2>");
      expect(html).not.toContain("<h2>범주형 변수 연관성</h2>");
      expect(html).not.toContain("<h2>다중공선성 진단</h2>");
      expect(html).not.toContain("<h2>그룹 차이 검정</h2>");
      expect(html).not.toContain("<h2>이상치 탐지</h2>");
      expect(html).not.toContain("<h2>시계열 동향</h2>");
    });

    it("omits the correlation section when no pair is significant", () => {
      const analysis: AnalysisResult = {
        ...buildEnrichedAnalysis(),
        correlationSummary: [
          {
            columnA: "매출액",
            columnB: "방문자수",
            coefficient: 0.05,
            strength: "거의 없음",
            pValue: 0.8,
            significant: false,
            interpretation: "상관계수 0.05, p=0.8000로 통계적으로 유의하지 않음",
          },
        ],
      };
      const { meta } = buildFixture();
      const html = buildReportHtml(meta, analysis);

      expect(html).not.toContain("<h2>상관 검정</h2>");
    });

    it("omits the outlier section when every column has zero outliers", () => {
      const analysis: AnalysisResult = {
        ...buildEnrichedAnalysis(),
        outlierSummary: [
          {
            column: "매출액",
            lowerBound: 800,
            upperBound: 2200,
            outlierCount: 0,
            outlierIndices: [],
            highConfidenceIndices: [],
            referenceIndices: [],
          },
        ],
      };
      const { meta } = buildFixture();
      const html = buildReportHtml(meta, analysis);

      expect(html).not.toContain("<h2>이상치 탐지</h2>");
    });

    it("escapes HTML special characters in interpretation text", () => {
      const analysis: AnalysisResult = {
        ...buildEnrichedAnalysis(),
        correlationSummary: [
          {
            columnA: "<b>매출액</b>",
            columnB: "방문자수",
            coefficient: 0.35,
            strength: "보통",
            pValue: 0.0021,
            significant: true,
            interpretation: "<script>alert('xss')</script>",
          },
        ],
      };
      const { meta } = buildFixture();
      const html = buildReportHtml(meta, analysis);

      expect(html).not.toContain("<script>alert('xss')</script>");
      expect(html).not.toContain("<b>매출액</b>");
      expect(html).toContain("&lt;script&gt;");
    });
  });
});
