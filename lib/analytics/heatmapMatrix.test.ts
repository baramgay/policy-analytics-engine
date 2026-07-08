import { describe, expect, it } from "vitest";
import { buildCorrelationMatrix } from "@/lib/analytics/heatmapMatrix";
import type { CorrelationPair } from "@/types/analysis";

function makePair(overrides: Partial<CorrelationPair>): CorrelationPair {
  return {
    columnA: "A",
    columnB: "B",
    coefficient: 0.5,
    strength: "강함",
    pValue: 0.01,
    significant: true,
    interpretation: "",
    ...overrides,
  };
}

describe("buildCorrelationMatrix", () => {
  it("returns empty columns when fewer than 3 unique columns appear", () => {
    const pairs = [makePair({ columnA: "A", columnB: "B" })];

    const result = buildCorrelationMatrix(pairs);

    expect(result.columns).toEqual([]);
    expect(result.cells).toEqual({});
  });

  it("fills the diagonal with coefficient 1 and significant false", () => {
    const pairs = [
      makePair({ columnA: "A", columnB: "B" }),
      makePair({ columnA: "A", columnB: "C" }),
      makePair({ columnA: "B", columnB: "C" }),
    ];

    const result = buildCorrelationMatrix(pairs);

    for (const column of result.columns) {
      expect(result.cells[column][column]).toEqual({ coefficient: 1, significant: false });
    }
  });

  it("fills cells symmetrically for both orderings of a pair", () => {
    const pairs = [
      makePair({ columnA: "A", columnB: "B", coefficient: 0.42, significant: true }),
      makePair({ columnA: "A", columnB: "C", coefficient: -0.3, significant: false }),
      makePair({ columnA: "B", columnB: "C", coefficient: 0.1, significant: false }),
    ];

    const result = buildCorrelationMatrix(pairs);

    expect(result.cells["A"]["B"]).toEqual({ coefficient: 0.42, significant: true });
    expect(result.cells["B"]["A"]).toEqual({ coefficient: 0.42, significant: true });
    expect(result.cells["A"]["C"]).toEqual({ coefficient: -0.3, significant: false });
    expect(result.cells["C"]["A"]).toEqual({ coefficient: -0.3, significant: false });
  });

  it("sets missing pair combinations to null", () => {
    const pairs = [
      makePair({ columnA: "A", columnB: "B" }),
      makePair({ columnA: "A", columnB: "C" }),
      makePair({ columnA: "A", columnB: "D" }),
    ];

    const result = buildCorrelationMatrix(pairs);

    expect(result.cells["B"]["C"]).toBeNull();
    expect(result.cells["C"]["D"]).toBeNull();
  });

  it("includes every unique column that appears across the pairs", () => {
    const pairs = [
      makePair({ columnA: "A", columnB: "B" }),
      makePair({ columnA: "A", columnB: "C" }),
      makePair({ columnA: "B", columnB: "C" }),
      makePair({ columnA: "C", columnB: "D" }),
    ];

    const result = buildCorrelationMatrix(pairs);

    expect(result.columns.sort()).toEqual(["A", "B", "C", "D"]);
  });
});
