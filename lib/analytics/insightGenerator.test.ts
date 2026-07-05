import { describe, expect, it } from "vitest";
import { generateInsight } from "@/lib/analytics/insightGenerator";
import { checkQuality } from "@/lib/analytics/qualityChecker";
import { profileSchema } from "@/lib/analytics/schemaProfiler";
import {
  generateCategoricalSummary,
  generateNumericSummary,
} from "@/lib/analytics/statsGenerator";
import type { ParsedDataset } from "@/types/analysis";

function buildInsight(dataset: ParsedDataset) {
  const schema = profileSchema(dataset);
  const missingSummary = checkQuality(dataset, schema);
  const numericSummary = generateNumericSummary(dataset, schema);
  const categoricalSummary = generateCategoricalSummary(dataset, schema);
  return generateInsight(schema, missingSummary, numericSummary, categoricalSummary, 80);
}

describe("generateInsight", () => {
  it("reports no missing values when the dataset has none", () => {
    const dataset: ParsedDataset = {
      columns: ["금액"],
      rows: [{ 금액: 1000 }, { 금액: 2000 }],
    };

    const insight = buildInsight(dataset);

    expect(insight).toContain("결측치는 발견되지 않았습니다");
  });

  it("names the worst-offending column when missing values exist", () => {
    const dataset: ParsedDataset = {
      columns: ["금액", "비고"],
      rows: [
        { 금액: 1000, 비고: null },
        { 금액: 2000, 비고: null },
        { 금액: null, 비고: null },
      ],
    };

    const insight = buildInsight(dataset);

    expect(insight).toContain("비고");
    expect(insight).toContain("결측");
  });

  it("mentions duplicate rows when duplicates are present", () => {
    const dataset: ParsedDataset = {
      columns: ["지역", "금액"],
      rows: [
        { 지역: "창원시", 금액: 1000 },
        { 지역: "창원시", 금액: 1000 },
      ],
    };

    const insight = buildInsight(dataset);

    expect(insight).toContain("중복 행이");
  });

  it("summarizes the primary numeric column's range", () => {
    const dataset: ParsedDataset = {
      columns: ["금액"],
      rows: [{ 금액: 1000 }, { 금액: 2000 }, { 금액: 3000 }],
    };

    const insight = buildInsight(dataset);

    expect(insight).toContain("금액");
    expect(insight).toContain("평균은");
  });

  it("summarizes the primary categorical column's top value share", () => {
    const dataset: ParsedDataset = {
      columns: ["지역"],
      rows: [
        { 지역: "창원시" },
        { 지역: "창원시" },
        { 지역: "창원시" },
        { 지역: "진주시" },
      ],
    };

    const insight = buildInsight(dataset);

    expect(insight).toContain("지역");
    expect(insight).toContain("창원시");
  });
});
