import { describe, expect, it } from "vitest";
import { recommendCharts } from "@/lib/analytics/chartRecommender";
import { profileSchema } from "@/lib/analytics/schemaProfiler";
import {
  generateCategoricalSummary,
  generateNumericSummary,
} from "@/lib/analytics/statsGenerator";
import type { ParsedDataset } from "@/types/analysis";

describe("recommendCharts", () => {
  it("recommends a line chart when the dataset has both a date column and a numeric column", () => {
    const dataset: ParsedDataset = {
      columns: ["날짜", "금액"],
      rows: [
        { 날짜: "2026-01-01", 금액: 1000 },
        { 날짜: "2026-01-02", 금액: 2000 },
        { 날짜: "2026-01-03", 금액: 1500 },
      ],
    };
    const schema = profileSchema(dataset);
    const numericSummary = generateNumericSummary(dataset, schema);
    const categoricalSummary = generateCategoricalSummary(dataset, schema);

    const result = recommendCharts(dataset, schema, numericSummary, categoricalSummary);

    const lineChart = result.find((spec) => spec.type === "line");
    expect(lineChart).toBeDefined();
    expect(lineChart?.xKey).toBe("날짜");
    expect(lineChart?.yKey).toBe("금액");
  });

  it("recommends bar and pie charts when the dataset has a categorical column", () => {
    const dataset: ParsedDataset = {
      columns: ["지역"],
      rows: [
        { 지역: "창원시" },
        { 지역: "진주시" },
        { 지역: "창원시" },
        { 지역: "진주시" },
        { 지역: "창원시" },
        { 지역: "김해시" },
      ],
    };
    const schema = profileSchema(dataset);
    const numericSummary = generateNumericSummary(dataset, schema);
    const categoricalSummary = generateCategoricalSummary(dataset, schema);

    const result = recommendCharts(dataset, schema, numericSummary, categoricalSummary);

    const types = result.map((spec) => spec.type);
    expect(types).toContain("bar");
    expect(types).toContain("pie");
  });

  it("returns an empty array when the dataset has neither numeric nor categorical columns", () => {
    const dataset: ParsedDataset = {
      columns: ["의견"],
      rows: [
        { 의견: "이 제품은 아주 만족스럽습니다" },
        { 의견: "배송이 조금 늦었습니다" },
        { 의견: "다시 구매할 의향이 있습니다" },
      ],
    };
    const schema = profileSchema(dataset);
    const numericSummary = generateNumericSummary(dataset, schema);
    const categoricalSummary = generateCategoricalSummary(dataset, schema);

    const result = recommendCharts(dataset, schema, numericSummary, categoricalSummary);

    expect(result).toEqual([]);
  });
});
