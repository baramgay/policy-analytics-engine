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

  it("recommends a second bar chart comparing the second categorical column against the primary numeric column", () => {
    const dataset: ParsedDataset = {
      columns: ["연령대", "성별", "지출액"],
      rows: [
        { 연령대: "20대", 성별: "남", 지출액: 182000 },
        { 연령대: "20대", 성별: "여", 지출액: 215000 },
        { 연령대: "30대", 성별: "남", 지출액: 254000 },
        { 연령대: "30대", 성별: "여", 지출액: 268000 },
        { 연령대: "40대", 성별: "남", 지출액: 301000 },
        { 연령대: "40대", 성별: "여", 지출액: 289000 },
      ],
    };
    const schema = profileSchema(dataset);
    const numericSummary = generateNumericSummary(dataset, schema);
    const categoricalSummary = generateCategoricalSummary(dataset, schema);

    const result = recommendCharts(dataset, schema, numericSummary, categoricalSummary);

    const secondBarChart = result.find((spec) => spec.id === "bar-성별-지출액");
    expect(secondBarChart).toBeDefined();
    expect(secondBarChart?.xKey).toBe("성별");
  });

  it("recommends a grouped-bar chart from the most significant group comparison result", () => {
    const dataset: ParsedDataset = {
      columns: ["성별", "지출액"],
      rows: [
        { 성별: "남", 지출액: 100 },
        { 성별: "여", 지출액: 200 },
      ],
    };
    const schema = profileSchema(dataset);
    const numericSummary = generateNumericSummary(dataset, schema);
    const categoricalSummary = generateCategoricalSummary(dataset, schema);
    const groupComparisonSummary = [
      {
        groupColumn: "성별",
        numericColumn: "지출액",
        method: "welch-t" as const,
        groupCount: 2,
        statistic: -5,
        pValue: 0.01,
        significant: true,
        groupMeans: [
          { group: "남", mean: 100, count: 1 },
          { group: "여", mean: 200, count: 1 },
        ],
      },
    ];

    const result = recommendCharts(
      dataset,
      schema,
      numericSummary,
      categoricalSummary,
      groupComparisonSummary
    );

    const groupedChart = result.find((spec) => spec.type === "grouped-bar");
    expect(groupedChart).toBeDefined();
    expect(groupedChart?.xKey).toBe("성별");
    expect(groupedChart?.data).toHaveLength(2);
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
