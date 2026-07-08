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

  it("computes Cohen's d for a two-group comparison with a clear mean difference", () => {
    const dataset: ParsedDataset = {
      columns: ["구분", "값"],
      rows: [
        { 구분: "A", 값: 8 },
        { 구분: "A", 값: 9 },
        { 구분: "A", 값: 10 },
        { 구분: "A", 값: 11 },
        { 구분: "A", 값: 12 },
        { 구분: "B", 값: 13 },
        { 구분: "B", 값: 14 },
        { 구분: "B", 값: 15 },
        { 구분: "B", 값: 16 },
        { 구분: "B", 값: 17 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateGroupComparisonSummary(dataset, schema);

    expect(result[0].effectSize?.type).toBe("cohen_d");
    expect(Math.abs(result[0].effectSize?.value ?? 0)).toBeCloseTo(3.162, 2);
    expect(result[0].effectSize?.magnitude).toBe("큼");
  });

  it("computes eta squared for a three-group ANOVA comparison", () => {
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

    expect(result[0].effectSize?.type).toBe("eta_squared");
    expect(result[0].effectSize?.value).toBeCloseTo(0.996, 2);
    expect(result[0].effectSize?.magnitude).toBe("큼");
  });

  it("computes the sample standard deviation (n-1) for each group mean", () => {
    const dataset: ParsedDataset = {
      columns: ["구분", "값"],
      rows: [
        { 구분: "A", 값: 2 },
        { 구분: "A", 값: 4 },
        { 구분: "A", 값: 6 },
        { 구분: "B", 값: 20 },
        { 구분: "B", 값: 22 },
        { 구분: "B", 값: 24 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateGroupComparisonSummary(dataset, schema);

    const groupA = result[0].groupMeans.find((g) => g.group === "A");
    expect(groupA?.sd).toBeCloseTo(2, 5);
  });

  it("flags a small effect size despite statistical significance in a large sample", () => {
    const groupA = Array.from({ length: 1000 }, (_, i) => (i % 2 === 0 ? 99.5 : 100.5));
    const groupB = Array.from({ length: 1000 }, (_, i) => (i % 2 === 0 ? 99.6 : 100.6));
    const dataset: ParsedDataset = {
      columns: ["구분", "값"],
      rows: [
        ...groupA.map((v) => ({ 구분: "A", 값: v })),
        ...groupB.map((v) => ({ 구분: "B", 값: v })),
      ],
    };
    const schema = profileSchema(dataset);

    const result = generateGroupComparisonSummary(dataset, schema);

    expect(result[0].significant).toBe(true);
    expect(result[0].effectSize?.magnitude).toBe("작음");
    expect(result[0].interpretation).toContain("작아 실질적 차이는 크지 않음");
  });
});
