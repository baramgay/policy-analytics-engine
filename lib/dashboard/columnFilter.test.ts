import { describe, expect, it } from "vitest";
import { availableColumnTypes, buildColumnOverview, filterColumnsByType } from "@/lib/dashboard/columnFilter";
import type { MissingSummary, SchemaSummary } from "@/types/analysis";

const schema: SchemaSummary = {
  rowCount: 10,
  columnCount: 3,
  columns: [
    { name: "금액", type: "numeric", sampleValues: [1000, 2000, null] },
    { name: "지역", type: "categorical", sampleValues: ["창원시", "진주시"] },
    { name: "등록일", type: "date", sampleValues: ["2026-01-01"] },
  ],
};

const missing: MissingSummary = {
  totalCells: 30,
  totalMissingCells: 2,
  overallMissingRate: 2 / 30,
  duplicateRowCount: 0,
  columns: [
    { name: "금액", missingCount: 1, missingRate: 0.1 },
    { name: "지역", missingCount: 1, missingRate: 0.1 },
    { name: "등록일", missingCount: 0, missingRate: 0 },
  ],
};

describe("buildColumnOverview", () => {
  it("joins schema type info with per-column missing rate", () => {
    const rows = buildColumnOverview(schema, missing);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ name: "금액", type: "numeric", missingRate: 0.1 });
    expect(rows[0].sampleValues).toBe("1000, 2000, -");
  });

  it("defaults missing rate to 0 when a column has no missing-summary entry", () => {
    const rows = buildColumnOverview(schema, { ...missing, columns: [] });
    expect(rows.every((row) => row.missingRate === 0)).toBe(true);
  });
});

describe("filterColumnsByType", () => {
  const rows = buildColumnOverview(schema, missing);

  it("returns all rows when filter is 'all'", () => {
    expect(filterColumnsByType(rows, "all")).toHaveLength(3);
  });

  it("returns only rows matching the requested type", () => {
    const numeric = filterColumnsByType(rows, "numeric");
    expect(numeric.map((r) => r.name)).toEqual(["금액"]);
  });

  it("returns an empty array when no column matches the type", () => {
    expect(filterColumnsByType(rows, "boolean")).toEqual([]);
  });
});

describe("availableColumnTypes", () => {
  it("returns only the types actually present, in fixed display order", () => {
    const rows = buildColumnOverview(schema, missing);
    expect(availableColumnTypes(rows)).toEqual(["numeric", "categorical", "date"]);
  });

  it("returns an empty array for an empty column list", () => {
    expect(availableColumnTypes([])).toEqual([]);
  });
});
