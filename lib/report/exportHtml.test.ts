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
});
