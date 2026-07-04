import { describe, expect, it } from "vitest";
import { profileSchema } from "@/lib/analytics/schemaProfiler";
import type { ParsedDataset } from "@/types/analysis";

describe("profileSchema", () => {
  it("infers correct type per column across mixed column types", () => {
    const dataset: ParsedDataset = {
      columns: ["금액", "지역", "날짜", "동의여부", "의견"],
      rows: [
        {
          금액: 1000,
          지역: "창원시",
          날짜: "2026-01-01",
          동의여부: "true",
          의견: "이 제품은 아주 만족스럽습니다",
        },
        {
          금액: 2000,
          지역: "진주시",
          날짜: "2026-01-02",
          동의여부: "false",
          의견: "배송이 조금 늦었습니다",
        },
        {
          금액: 1500,
          지역: "창원시",
          날짜: "2026-01-03",
          동의여부: "true",
          의견: "다시 구매할 의향이 있습니다",
        },
        {
          금액: 3000,
          지역: "진주시",
          날짜: "2026-01-04",
          동의여부: "false",
          의견: "가격 대비 품질이 우수합니다",
        },
      ],
    };

    const result = profileSchema(dataset);

    expect(result.rowCount).toBe(4);
    expect(result.columnCount).toBe(5);

    const typeByName = Object.fromEntries(
      result.columns.map((col) => [col.name, col.type]),
    );

    expect(typeByName["금액"]).toBe("numeric");
    expect(typeByName["지역"]).toBe("categorical");
    expect(typeByName["날짜"]).toBe("date");
    expect(typeByName["동의여부"]).toBe("boolean");
    expect(typeByName["의견"]).toBe("text");
  });

  it("classifies an all-null column as text with an empty sample", () => {
    const dataset: ParsedDataset = {
      columns: ["비고"],
      rows: [{ 비고: null }, { 비고: null }, { 비고: null }, { 비고: null }],
    };

    const result = profileSchema(dataset);

    expect(result.columns).toHaveLength(1);
    expect(result.columns[0].name).toBe("비고");
    expect(result.columns[0].type).toBe("text");
    expect(result.columns[0].sampleValues).toEqual([]);
  });

  it("handles an empty dataset (0 rows) by defaulting every column to text", () => {
    const dataset: ParsedDataset = {
      columns: ["금액", "지역"],
      rows: [],
    };

    const result = profileSchema(dataset);

    expect(result.rowCount).toBe(0);
    expect(result.columnCount).toBe(2);
    expect(result.columns).toHaveLength(2);
    for (const column of result.columns) {
      expect(column.type).toBe("text");
      expect(column.sampleValues).toEqual([]);
    }
  });
});
