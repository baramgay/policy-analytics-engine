import { describe, expect, it } from "vitest";
import { generateTimeSeriesSummary } from "@/lib/analytics/dateDetector";
import { profileSchema } from "@/lib/analytics/schemaProfiler";
import type { ParsedDataset } from "@/types/analysis";

describe("generateTimeSeriesSummary", () => {
  it("computes an increasing trend and moving average for a monotonically rising series", () => {
    const dataset: ParsedDataset = {
      columns: ["날짜", "매출"],
      rows: [
        { 날짜: "2026-01-01", 매출: 100 },
        { 날짜: "2026-01-02", 매출: 200 },
        { 날짜: "2026-01-03", 매출: 300 },
        { 날짜: "2026-01-04", 매출: 400 },
        { 날짜: "2026-01-05", 매출: 500 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateTimeSeriesSummary(dataset, schema);

    expect(result).toHaveLength(1);
    expect(result[0].trendDirection).toBe("증가");
    expect(result[0].trendSlope).toBeGreaterThan(0);
    expect(result[0].points).toHaveLength(5);
    expect(result[0].points[0].movingAverage).toBeNull();
    expect(result[0].points[2].movingAverage).toBe(200);
    expect(result[0].points[4].movingAverage).toBe(400);
  });

  it("computes a decreasing trend for a falling series", () => {
    const dataset: ParsedDataset = {
      columns: ["날짜", "재고"],
      rows: [
        { 날짜: "2026-01-01", 재고: 500 },
        { 날짜: "2026-01-02", 재고: 400 },
        { 날짜: "2026-01-03", 재고: 300 },
        { 날짜: "2026-01-04", 재고: 200 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateTimeSeriesSummary(dataset, schema);

    expect(result[0].trendDirection).toBe("감소");
    expect(result[0].trendSlope).toBeLessThan(0);
  });

  it("returns an empty array when there is no date column", () => {
    const dataset: ParsedDataset = {
      columns: ["금액"],
      rows: [{ 금액: 100 }, { 금액: 200 }],
    };
    const schema = profileSchema(dataset);

    const result = generateTimeSeriesSummary(dataset, schema);

    expect(result).toEqual([]);
  });

  it("aggregates duplicate dates by averaging before computing the trend", () => {
    const dataset: ParsedDataset = {
      columns: ["날짜", "금액"],
      rows: [
        { 날짜: "2026-01-01", 금액: 100 },
        { 날짜: "2026-01-01", 금액: 200 },
        { 날짜: "2026-01-02", 금액: 300 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateTimeSeriesSummary(dataset, schema);

    expect(result[0].points).toHaveLength(2);
    expect(result[0].points[0].value).toBe(150);
  });
});
