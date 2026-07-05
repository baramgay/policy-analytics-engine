import { describe, expect, it } from "vitest";
import { analyzePreprocessing, applyPreprocessing } from "@/lib/analytics/preprocessor";
import { profileSchema } from "@/lib/analytics/schemaProfiler";
import type { ParsedDataset } from "@/types/analysis";

describe("analyzePreprocessing", () => {
  it("suggests fill/drop/cap-iqr when missing values, duplicates, and outliers are all present", () => {
    const dataset: ParsedDataset = {
      columns: ["금액", "지역"],
      rows: [
        { 금액: 1000, 지역: "창원시" },
        { 금액: 1000, 지역: "창원시" },
        { 금액: null, 지역: "진주시" },
        { 금액: 2000, 지역: "김해시" },
        { 금액: 100000, 지역: "거제시" },
      ],
    };
    const schema = profileSchema(dataset);

    const suggestion = analyzePreprocessing(dataset, schema);

    expect(suggestion.duplicateRowCount).toBe(1);
    expect(suggestion.missingRate).toBeGreaterThan(0);
    expect(suggestion.outlierColumns.map((c) => c.column)).toContain("금액");
    expect(suggestion.recommended).toEqual({
      missingStrategy: "fill",
      duplicateStrategy: "drop",
      outlierStrategy: "cap-iqr",
    });
  });

  it("suggests keep/keep/keep for a clean dataset", () => {
    const dataset: ParsedDataset = {
      columns: ["금액", "지역"],
      rows: [
        { 금액: 1000, 지역: "창원시" },
        { 금액: 1200, 지역: "진주시" },
        { 금액: 900, 지역: "김해시" },
      ],
    };
    const schema = profileSchema(dataset);

    const suggestion = analyzePreprocessing(dataset, schema);

    expect(suggestion.recommended).toEqual({
      missingStrategy: "keep",
      duplicateStrategy: "keep",
      outlierStrategy: "keep",
    });
  });
});

describe("applyPreprocessing", () => {
  it("drops duplicate rows when duplicateStrategy is drop", () => {
    const dataset: ParsedDataset = {
      columns: ["금액", "지역"],
      rows: [
        { 금액: 1000, 지역: "창원시" },
        { 금액: 1000, 지역: "창원시" },
        { 금액: 2000, 지역: "진주시" },
      ],
    };
    const schema = profileSchema(dataset);

    const { dataset: cleaned, report } = applyPreprocessing(dataset, schema, {
      missingStrategy: "keep",
      duplicateStrategy: "drop",
      outlierStrategy: "keep",
    });

    expect(cleaned.rows).toHaveLength(2);
    expect(report.droppedRowCount).toBe(1);
  });

  it("fills missing numeric cells with the column mean and text cells with the mode", () => {
    const dataset: ParsedDataset = {
      columns: ["금액", "지역"],
      rows: [
        { 금액: 1000, 지역: "창원시" },
        { 금액: null, 지역: "창원시" },
        { 금액: 2000, 지역: null },
      ],
    };
    const schema = profileSchema(dataset);

    const { dataset: cleaned, report } = applyPreprocessing(dataset, schema, {
      missingStrategy: "fill",
      duplicateStrategy: "keep",
      outlierStrategy: "keep",
    });

    expect(cleaned.rows[1].금액).toBe(1500);
    expect(cleaned.rows[2].지역).toBe("창원시");
    expect(report.filledCellCount).toEqual(
      expect.arrayContaining([
        { column: "금액", count: 1, fillValue: 1500 },
        { column: "지역", count: 1, fillValue: "창원시" },
      ])
    );
  });

  it("drops rows with any missing cell when missingStrategy is drop-row", () => {
    const dataset: ParsedDataset = {
      columns: ["금액", "지역"],
      rows: [
        { 금액: 1000, 지역: "창원시" },
        { 금액: null, 지역: "진주시" },
      ],
    };
    const schema = profileSchema(dataset);

    const { dataset: cleaned, report } = applyPreprocessing(dataset, schema, {
      missingStrategy: "drop-row",
      duplicateStrategy: "keep",
      outlierStrategy: "keep",
    });

    expect(cleaned.rows).toHaveLength(1);
    expect(report.droppedRowCount).toBe(1);
  });

  it("caps numeric outliers to the IQR*1.5 bounds", () => {
    const dataset: ParsedDataset = {
      columns: ["금액"],
      rows: [
        { 금액: 10 },
        { 금액: 12 },
        { 금액: 11 },
        { 금액: 13 },
        { 금액: 1000 },
      ],
    };
    const schema = profileSchema(dataset);

    const { dataset: cleaned, report } = applyPreprocessing(dataset, schema, {
      missingStrategy: "keep",
      duplicateStrategy: "keep",
      outlierStrategy: "cap-iqr",
    });

    const values = cleaned.rows.map((r) => r.금액 as number);
    expect(Math.max(...values)).toBeLessThan(1000);
    expect(report.cappedOutlierCount).toEqual([{ column: "금액", count: 1 }]);
  });

  it("improves the quality score after filling missing values and dropping duplicates", () => {
    const dataset: ParsedDataset = {
      columns: ["금액", "지역"],
      rows: [
        { 금액: 1000, 지역: "창원시" },
        { 금액: 1000, 지역: "창원시" },
        { 금액: null, 지역: "진주시" },
        { 금액: null, 지역: "김해시" },
      ],
    };
    const schema = profileSchema(dataset);

    const { report } = applyPreprocessing(dataset, schema, {
      missingStrategy: "fill",
      duplicateStrategy: "drop",
      outlierStrategy: "keep",
    });

    expect(report.qualityScoreAfter).toBeGreaterThan(report.qualityScoreBefore);
  });
});
