import { describe, expect, it } from "vitest";
import { generateCorrelationSummary } from "@/lib/analytics/correlationAnalyzer";
import { profileSchema } from "@/lib/analytics/schemaProfiler";
import type { ParsedDataset } from "@/types/analysis";

describe("generateCorrelationSummary", () => {
  it("detects a perfect positive correlation between two numeric columns", () => {
    const dataset: ParsedDataset = {
      columns: ["금액", "수량"],
      rows: [
        { 금액: 1, 수량: 2 },
        { 금액: 2, 수량: 4 },
        { 금액: 3, 수량: 6 },
        { 금액: 4, 수량: 8 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateCorrelationSummary(dataset, schema);

    expect(result).toHaveLength(1);
    expect(result[0].coefficient).toBe(1);
    expect(result[0].strength).toBe("매우 강함");
  });

  it("detects a perfect negative correlation", () => {
    const dataset: ParsedDataset = {
      columns: ["금액", "재고"],
      rows: [
        { 금액: 1, 재고: 8 },
        { 금액: 2, 재고: 6 },
        { 금액: 3, 재고: 4 },
        { 금액: 4, 재고: 2 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateCorrelationSummary(dataset, schema);

    expect(result[0].coefficient).toBe(-1);
    expect(result[0].strength).toBe("매우 강함");
  });

  it("returns an empty array when fewer than two numeric columns exist", () => {
    const dataset: ParsedDataset = {
      columns: ["금액", "지역"],
      rows: [
        { 금액: 1, 지역: "창원시" },
        { 금액: 2, 지역: "진주시" },
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateCorrelationSummary(dataset, schema);

    expect(result).toEqual([]);
  });

  it("orders pairs by absolute coefficient descending across three numeric columns", () => {
    const dataset: ParsedDataset = {
      columns: ["a", "b", "c"],
      rows: [
        { a: 1, b: 2, c: 5 },
        { a: 2, b: 4, c: 3 },
        { a: 3, b: 6, c: 6 },
        { a: 4, b: 8, c: 1 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateCorrelationSummary(dataset, schema);

    expect(result).toHaveLength(3);
    const abPair = result.find((p) => p.columnA === "a" && p.columnB === "b");
    expect(abPair?.coefficient).toBe(1);
    expect(Math.abs(result[0].coefficient)).toBeGreaterThanOrEqual(Math.abs(result[1].coefficient));
  });
});
