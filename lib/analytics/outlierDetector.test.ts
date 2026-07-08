import { describe, expect, it } from "vitest";
import { detectOutliers } from "@/lib/analytics/outlierDetector";
import { profileSchema } from "@/lib/analytics/schemaProfiler";
import type { ParsedDataset } from "@/types/analysis";

describe("detectOutliers", () => {
  it("flags a value far outside the IQR range as an outlier", () => {
    const dataset: ParsedDataset = {
      columns: ["금액"],
      rows: [
        { 금액: 10 },
        { 금액: 12 },
        { 금액: 11 },
        { 금액: 13 },
        { 금액: 12 },
        { 금액: 1000 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = detectOutliers(dataset, schema);

    expect(result).toHaveLength(1);
    expect(result[0].outlierCount).toBe(1);
    expect(result[0].outlierIndices).toEqual([5]);
  });

  it("reports zero outliers for a tightly clustered column", () => {
    const dataset: ParsedDataset = {
      columns: ["점수"],
      rows: [{ 점수: 10 }, { 점수: 11 }, { 점수: 9 }, { 점수: 10 }, { 점수: 12 }],
    };
    const schema = profileSchema(dataset);

    const result = detectOutliers(dataset, schema);

    expect(result[0].outlierCount).toBe(0);
  });

  it("returns an empty array when there are no numeric columns", () => {
    const dataset: ParsedDataset = {
      columns: ["지역"],
      rows: [{ 지역: "창원시" }, { 지역: "진주시" }],
    };
    const schema = profileSchema(dataset);

    const result = detectOutliers(dataset, schema);

    expect(result).toEqual([]);
  });

  it("classifies a value flagged by both IQR and Z-score as high confidence", () => {
    const normalValues = [10, 11, 12, 13, 12, 11, 10, 13, 12, 11, 12, 13, 10, 11, 12];
    const dataset: ParsedDataset = {
      columns: ["금액"],
      rows: [...normalValues.map((v) => ({ 금액: v })), { 금액: 80 }],
    };
    const schema = profileSchema(dataset);

    const result = detectOutliers(dataset, schema);

    expect(result[0].highConfidenceIndices).toEqual([15]);
    expect(result[0].referenceIndices).toEqual([]);
  });

  it("classifies an extreme single-point outlier that skews the standard deviation as reference-only", () => {
    const dataset: ParsedDataset = {
      columns: ["금액"],
      rows: [
        { 금액: 10 },
        { 금액: 12 },
        { 금액: 11 },
        { 금액: 13 },
        { 금액: 12 },
        { 금액: 1000 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = detectOutliers(dataset, schema);

    expect(result[0].highConfidenceIndices).toEqual([]);
    expect(result[0].referenceIndices).toEqual([5]);
  });
});
