import { describe, expect, it } from "vitest";
import { checkQuality, computeQualityScore } from "@/lib/analytics/qualityChecker";
import { profileSchema } from "@/lib/analytics/schemaProfiler";
import type { MissingSummary, ParsedDataset } from "@/types/analysis";

describe("checkQuality", () => {
  it("computes per-column and overall missing-cell counts", () => {
    const dataset: ParsedDataset = {
      columns: ["금액", "지역"],
      rows: [
        { 금액: 1000, 지역: "창원시" },
        { 금액: null, 지역: "진주시" },
        { 금액: 2000, 지역: null },
        { 금액: null, 지역: "진주시" },
      ],
    };
    const schema = profileSchema(dataset);

    const result = checkQuality(dataset, schema);

    const byName = Object.fromEntries(result.columns.map((c) => [c.name, c]));
    expect(byName["금액"].missingCount).toBe(2);
    expect(byName["금액"].missingRate).toBeCloseTo(0.5);
    expect(byName["지역"].missingCount).toBe(1);
    expect(byName["지역"].missingRate).toBeCloseTo(0.25);

    expect(result.totalCells).toBe(8);
    expect(result.totalMissingCells).toBe(3);
    expect(result.overallMissingRate).toBeCloseTo(3 / 8);
  });

  it("detects duplicate rows that repeat identical values across every column", () => {
    const dataset: ParsedDataset = {
      columns: ["금액", "지역"],
      rows: [
        { 금액: 1000, 지역: "창원시" },
        { 금액: 1000, 지역: "창원시" },
        { 금액: 1000, 지역: "창원시" },
        { 금액: 2000, 지역: "진주시" },
      ],
    };
    const schema = profileSchema(dataset);

    const result = checkQuality(dataset, schema);

    // first "창원시" row establishes the signature, the next two repeats are duplicates
    expect(result.duplicateRowCount).toBe(2);
  });

  it("handles an empty dataset (0 rows) without dividing by zero", () => {
    const dataset: ParsedDataset = {
      columns: ["금액"],
      rows: [],
    };
    const schema = profileSchema(dataset);

    const result = checkQuality(dataset, schema);

    expect(result.totalCells).toBe(0);
    expect(result.totalMissingCells).toBe(0);
    expect(result.overallMissingRate).toBe(0);
    expect(result.duplicateRowCount).toBe(0);
    expect(result.columns[0].missingCount).toBe(0);
    expect(result.columns[0].missingRate).toBe(0);
  });
});

describe("computeQualityScore", () => {
  it("scores 100 for a large, complete, duplicate-free dataset", () => {
    const missingSummary: MissingSummary = {
      totalCells: 150,
      totalMissingCells: 0,
      overallMissingRate: 0,
      duplicateRowCount: 0,
      columns: [],
    };

    expect(computeQualityScore(missingSummary, 30)).toBe(100);
  });

  it("applies a small-volume penalty (rowCount < 10) to an otherwise perfect dataset", () => {
    const missingSummary: MissingSummary = {
      totalCells: 10,
      totalMissingCells: 0,
      overallMissingRate: 0,
      duplicateRowCount: 0,
      columns: [],
    };

    // volumePenalty = 20 for rowCount < 10, no missing/duplicate penalty -> 100 - 20 = 80
    expect(computeQualityScore(missingSummary, 5)).toBe(80);
  });

  it("clamps the score at 0 for a dataset with heavy missingness and duplicates", () => {
    const missingSummary: MissingSummary = {
      totalCells: 10,
      totalMissingCells: 9,
      overallMissingRate: 0.9,
      duplicateRowCount: 5,
      columns: [],
    };

    // missingPenalty=54, duplicatePenalty=30 (rate 1.0), volumePenalty=20 (rowCount<10)
    // raw score = 100 - 54 - 30 - 20 = -4 -> clamped to 0
    expect(computeQualityScore(missingSummary, 5)).toBe(0);
  });
});
