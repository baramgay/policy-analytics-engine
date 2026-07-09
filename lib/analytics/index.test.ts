import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runAnalysis } from "@/lib/analytics/index";
import { parseCsvText } from "@/lib/analytics/parser";

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
