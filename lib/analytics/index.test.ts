import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runAnalysis } from "@/lib/analytics/index";
import { parseCsvText } from "@/lib/analytics/parser";
import type { ParsedDataset } from "@/types/analysis";

function loadSample(fileName: string): ReturnType<typeof parseCsvText> {
  const text = readFileSync(join(process.cwd(), "public", "sample-data", fileName), "utf-8");
  return parseCsvText(text);
}

describe("runAnalysis integration", () => {
  it("detects point-mode map and does not fall back to region mode for regional-facility-survey.csv", async () => {
    const dataset = await loadSample("regional-facility-survey.csv");

    const result = runAnalysis(dataset);

    expect(result.mapSpecs.detected).toBe(true);
    expect(result.mapSpecs.mode).toBe("point");
    expect(result.mapSpecs.points.length).toBeGreaterThan(0);
  });

  it("recommends a second bar chart for category-crosstab-sample.csv (2 categorical + 1 numeric)", async () => {
    const dataset = await loadSample("category-crosstab-sample.csv");

    const result = runAnalysis(dataset);

    const chartTypes = result.chartSpecs.map((spec) => spec.type);
    expect(chartTypes.filter((t) => t === "bar").length).toBeGreaterThanOrEqual(2);
    expect(result.insightSummary.length).toBeGreaterThan(0);
  });

  it("completes without throwing for edge-case-sparse.csv (all-null column, <5 rows)", async () => {
    const dataset = await loadSample("edge-case-sparse.csv");

    const result = runAnalysis(dataset);

    expect(result.schemaSummary.rowCount).toBeLessThan(5);
    expect(result.qualityScore).toBeGreaterThanOrEqual(0);
    expect(result.qualityScore).toBeLessThanOrEqual(100);
    expect(result.insightSummary.length).toBeGreaterThan(0);
  });
});

describe("runAnalysis integration - extended statistical fields", () => {
  it("surfaces all extended statistical fields across the full pipeline", () => {
    const dataset: ParsedDataset = {
      columns: ["날짜", "성별", "구매여부", "금액", "수량"],
      rows: [
        { 날짜: "2025-01-01", 성별: "남", 구매여부: "구매", 금액: 100, 수량: 2 },
        { 날짜: "2025-02-01", 성별: "남", 구매여부: "구매", 금액: 110, 수량: 3 },
        { 날짜: "2025-03-01", 성별: "여", 구매여부: "미구매", 금액: 500, 수량: 1 },
        { 날짜: "2025-04-01", 성별: "여", 구매여부: "미구매", 금액: 520, 수량: 1 },
        { 날짜: "2025-05-01", 성별: "남", 구매여부: "구매", 금액: 105, 수량: 2 },
        { 날짜: "2025-06-01", 성별: "여", 구매여부: "미구매", 금액: 510, 수량: 1 },
      ],
    };
    const result = runAnalysis(dataset);
    expect(result.correlationSummary?.[0]).toHaveProperty("pValue");
    expect(result.groupComparisonSummary?.[0]).toHaveProperty("effectSize");
    expect(result.outlierSummary?.[0]).toHaveProperty("highConfidenceIndices");
    expect(result.timeSeriesSummary?.[0]).toHaveProperty("momChange");
    expect(result.categoricalCorrelationSummary).toBeDefined();
    expect(result.vifSummary).toBeDefined();
  });
});
