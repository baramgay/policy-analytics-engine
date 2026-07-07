import { describe, expect, it } from "vitest";
import { generateCorrelationSummary, generateCategoricalCorrelationSummary } from "@/lib/analytics/correlationAnalyzer";
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

  it("marks a strong correlation from enough samples as statistically significant", () => {
    const dataset: ParsedDataset = {
      columns: ["금액", "수량"],
      rows: [
        { 금액: 1, 수량: 2.1 },
        { 금액: 2, 수량: 3.9 },
        { 금액: 3, 수량: 6.2 },
        { 금액: 4, 수량: 7.8 },
        { 금액: 5, 수량: 10.1 },
        { 금액: 6, 수량: 11.9 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateCorrelationSummary(dataset, schema);

    expect(result[0].significant).toBe(true);
    expect(result[0].pValue).toBeLessThan(0.05);
    expect(result[0].interpretation).toContain("유의한");
  });

  it("marks a weak correlation from a small sample as not statistically significant", () => {
    const dataset: ParsedDataset = {
      columns: ["금액", "임의값"],
      rows: [
        { 금액: 1, 임의값: 5 },
        { 금액: 2, 임의값: 3 },
        { 금액: 3, 임의값: 6 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateCorrelationSummary(dataset, schema);

    expect(result[0].significant).toBe(false);
  });

  it("formats a perfect correlation's p-value as p<0.001 instead of p=0", () => {
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

    expect(result[0].pValue).toBe(0);
    expect(result[0].interpretation).toContain("p<0.001");
    expect(result[0].interpretation).not.toContain("p=0으로");
  });
});

describe("generateCategoricalCorrelationSummary", () => {
  it("detects a strong, reliable association between two categorical columns", () => {
    const rows = [
      ...Array.from({ length: 20 }, () => ({ 그룹: "A", 결과: "성공" })),
      ...Array.from({ length: 20 }, () => ({ 그룹: "B", 결과: "실패" })),
    ];
    const dataset: ParsedDataset = { columns: ["그룹", "결과"], rows };
    const schema = profileSchema(dataset);

    const result = generateCategoricalCorrelationSummary(dataset, schema);

    expect(result).toHaveLength(1);
    expect(result[0].significant).toBe(true);
    expect(result[0].reliable).toBe(true);
    expect(result[0].cramersV).toBeGreaterThan(0.9);
  });

  it("flags a small-sample contingency table as unreliable", () => {
    const dataset: ParsedDataset = {
      columns: ["그룹", "결과"],
      rows: [
        { 그룹: "A", 결과: "성공" },
        { 그룹: "A", 결과: "실패" },
        { 그룹: "B", 결과: "성공" },
        { 그룹: "B", 결과: "실패" },
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateCategoricalCorrelationSummary(dataset, schema);

    expect(result[0].reliable).toBe(false);
    expect(result[0].interpretation).toBe("표본이 작아 참고용");
  });

  it("returns an empty array when fewer than two categorical columns exist", () => {
    const dataset: ParsedDataset = {
      columns: ["금액"],
      rows: [{ 금액: 1 }, { 금액: 2 }],
    };
    const schema = profileSchema(dataset);

    const result = generateCategoricalCorrelationSummary(dataset, schema);

    expect(result).toEqual([]);
  });
});
