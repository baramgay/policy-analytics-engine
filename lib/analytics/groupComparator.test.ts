import { describe, expect, it } from "vitest";
import { generateGroupComparisonSummary } from "@/lib/analytics/groupComparator";
import { profileSchema } from "@/lib/analytics/schemaProfiler";
import type { ParsedDataset } from "@/types/analysis";

describe("generateGroupComparisonSummary", () => {
  it("runs Welch's t-test for a two-group categorical + numeric combination", () => {
    const dataset: ParsedDataset = {
      columns: ["성별", "지출액"],
      rows: [
        { 성별: "남", 지출액: 100 },
        { 성별: "남", 지출액: 110 },
        { 성별: "남", 지출액: 105 },
        { 성별: "여", 지출액: 200 },
        { 성별: "여", 지출액: 210 },
        { 성별: "여", 지출액: 205 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateGroupComparisonSummary(dataset, schema);

    expect(result).toHaveLength(1);
    expect(result[0].method).toBe("welch-t");
    expect(result[0].groupCount).toBe(2);
    expect(result[0].significant).toBe(true);
    expect(result[0].pValue).toBeLessThan(0.05);
  });

  it("runs one-way ANOVA for a three-or-more-group combination", () => {
    const dataset: ParsedDataset = {
      columns: ["연령대", "지출액"],
      rows: [
        { 연령대: "20대", 지출액: 100 },
        { 연령대: "20대", 지출액: 110 },
        { 연령대: "30대", 지출액: 200 },
        { 연령대: "30대", 지출액: 210 },
        { 연령대: "40대", 지출액: 300 },
        { 연령대: "40대", 지출액: 310 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateGroupComparisonSummary(dataset, schema);

    expect(result).toHaveLength(1);
    expect(result[0].method).toBe("anova-f");
    expect(result[0].groupCount).toBe(3);
    expect(result[0].significant).toBe(true);
  });

  it("reports non-significant results when group means are nearly identical", () => {
    const dataset: ParsedDataset = {
      columns: ["성별", "점수"],
      rows: [
        { 성별: "남", 점수: 50 },
        { 성별: "남", 점수: 52 },
        { 성별: "남", 점수: 48 },
        { 성별: "여", 점수: 51 },
        { 성별: "여", 점수: 49 },
        { 성별: "여", 점수: 50 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateGroupComparisonSummary(dataset, schema);

    expect(result[0].significant).toBe(false);
    expect(result[0].pValue).toBeGreaterThanOrEqual(0.05);
  });

  it("skips a group column when a group has fewer than two members", () => {
    const dataset: ParsedDataset = {
      columns: ["지역", "금액"],
      rows: [
        { 지역: "창원시", 금액: 100 },
        { 지역: "진주시", 금액: 200 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateGroupComparisonSummary(dataset, schema);

    expect(result).toEqual([]);
  });
});
