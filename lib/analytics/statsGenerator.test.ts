import { describe, expect, it } from "vitest";
import {
  generateCategoricalSummary,
  generateNumericSummary,
} from "@/lib/analytics/statsGenerator";
import { profileSchema } from "@/lib/analytics/schemaProfiler";
import type { ParsedDataset } from "@/types/analysis";

describe("generateNumericSummary", () => {
  it("computes basic stats on a 5-value numeric column", () => {
    const dataset: ParsedDataset = {
      columns: ["점수"],
      rows: [
        { 점수: 1 },
        { 점수: 2 },
        { 점수: 3 },
        { 점수: 4 },
        { 점수: 5 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateNumericSummary(dataset, schema);

    expect(result).toHaveLength(1);
    expect(result[0].column).toBe("점수");
    expect(result[0].count).toBe(5);
    expect(result[0].mean).toBe(3);
    expect(result[0].min).toBe(1);
    expect(result[0].max).toBe(5);
    expect(result[0].median).toBe(3);
  });

  it("excludes null values from count, mean, min, max, and median", () => {
    const dataset: ParsedDataset = {
      columns: ["점수"],
      rows: [{ 점수: 10 }, { 점수: null }, { 점수: 20 }],
    };
    const schema = profileSchema(dataset);

    const result = generateNumericSummary(dataset, schema);

    expect(result[0].count).toBe(2);
    expect(result[0].mean).toBe(15);
    expect(result[0].min).toBe(10);
    expect(result[0].max).toBe(20);
    expect(result[0].median).toBe(15);
  });

  it("returns an empty array when the dataset has no numeric columns", () => {
    const dataset: ParsedDataset = {
      columns: ["지역"],
      rows: [{ 지역: "창원시" }, { 지역: "진주시" }],
    };
    const schema = profileSchema(dataset);

    const result = generateNumericSummary(dataset, schema);

    expect(result).toEqual([]);
  });
});

describe("generateCategoricalSummary", () => {
  it("ranks the top value with its ratio among non-null values", () => {
    const dataset: ParsedDataset = {
      columns: ["지역"],
      rows: [
        { 지역: "창원시" },
        { 지역: "창원시" },
        { 지역: "창원시" },
        { 지역: "진주시" },
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateCategoricalSummary(dataset, schema);

    expect(result).toHaveLength(1);
    const top = result[0].topValues[0];
    expect(top.value).toBe("창원시");
    expect(top.count).toBe(3);
    expect(top.ratio).toBe(0.75);
  });

  it("excludes nulls from the ratio denominator", () => {
    const dataset: ParsedDataset = {
      columns: ["지역"],
      rows: [{ 지역: "창원시" }, { 지역: null }, { 지역: "창원시" }],
    };
    const schema = profileSchema(dataset);

    const result = generateCategoricalSummary(dataset, schema);

    const top = result[0].topValues[0];
    expect(top.value).toBe("창원시");
    expect(top.count).toBe(2);
    expect(top.ratio).toBe(1);
  });
});
