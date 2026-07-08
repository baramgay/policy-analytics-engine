import { describe, expect, it } from "vitest";
import { recommendCharts } from "@/lib/analytics/chartRecommender";
import { profileSchema } from "@/lib/analytics/schemaProfiler";
import {
  generateCategoricalSummary,
  generateNumericSummary,
} from "@/lib/analytics/statsGenerator";
import type { CorrelationPair, ParsedDataset } from "@/types/analysis";

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
        effectSize: null,
        interpretation: "",
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

  it("recommends a scatter chart with a trend line for the most significant correlation pair", () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({
      광고비: i,
      매출액: i * 25 + (i % 3),
    }));
    const dataset: ParsedDataset = {
      columns: ["광고비", "매출액"],
      rows,
    };
    const schema = profileSchema(dataset);
    const numericSummary = generateNumericSummary(dataset, schema);
    const categoricalSummary = generateCategoricalSummary(dataset, schema);
    const correlationSummary: CorrelationPair[] = [
      {
        columnA: "광고비",
        columnB: "매출액",
        coefficient: 0.99,
        strength: "매우 강함",
        pValue: 0.0001,
        significant: true,
        interpretation: "상관계수 0.99, p<0.001로 통계적으로 유의한 매우 강함 양의 상관관계",
      },
    ];

    const result = recommendCharts(
      dataset,
      schema,
      numericSummary,
      categoricalSummary,
      undefined,
      correlationSummary
    );

    const scatterChart = result.find((spec) => spec.type === "scatter");
    expect(scatterChart).toBeDefined();
    expect(scatterChart?.trendLine?.slope).toBeGreaterThan(24);
    expect(scatterChart?.trendLine?.slope).toBeLessThan(26);
    expect(scatterChart?.trendLine?.segment).toHaveLength(2);
    expect(scatterChart?.subtitle).toContain("상관계수");
    expect(scatterChart?.data.length).toBeLessThanOrEqual(300);
  });

  it("computes the trend line from the full dataset, not the downsampled render points", () => {
    // 짝수 인덱스는 기울기 1, 홀수 인덱스는 기울기 100에 가깝게 구성한다.
    // 다운샘플 스트라이드가 2가 되도록 600행을 사용하면(300 초과), step=2로
    // 짝수 인덱스만 남는다 — 회귀를 샘플에서 계산하면 기울기가 1에 가깝게
    // 나오지만, 전체 데이터로 계산하면 훨씬 커야 한다.
    const rows = Array.from({ length: 600 }, (_, i) => ({
      x: i,
      y: i % 2 === 0 ? i : i * 100 + 5000,
    }));
    const dataset: ParsedDataset = { columns: ["x", "y"], rows };
    const schema = profileSchema(dataset);
    const numericSummary = generateNumericSummary(dataset, schema);
    const categoricalSummary = generateCategoricalSummary(dataset, schema);
    const correlationSummary: CorrelationPair[] = [
      {
        columnA: "x",
        columnB: "y",
        coefficient: 0.9,
        strength: "매우 강함",
        pValue: 0.0001,
        significant: true,
        interpretation: "",
      },
    ];

    const result = recommendCharts(
      dataset,
      schema,
      numericSummary,
      categoricalSummary,
      undefined,
      correlationSummary
    );
    const scatterChart = result.find((spec) => spec.type === "scatter");

    const n = rows.length;
    const meanX = rows.reduce((sum, r) => sum + r.x, 0) / n;
    const meanY = rows.reduce((sum, r) => sum + r.y, 0) / n;
    const sxx = rows.reduce((sum, r) => sum + (r.x - meanX) * (r.x - meanX), 0);
    const sxy = rows.reduce((sum, r) => sum + (r.x - meanX) * (r.y - meanY), 0);
    const expectedSlope = sxy / sxx;

    // 샘플(짝수 인덱스)만으로 계산하면 기울기가 대략 1에 불과하므로,
    // 전체 데이터 기준 기대값과는 확실히 구분된다.
    expect(expectedSlope).toBeGreaterThan(40);
    expect(scatterChart?.trendLine?.slope).toBeCloseTo(expectedSlope, 6);
    expect(scatterChart?.data.length).toBeLessThanOrEqual(300);
  });
});
