import { describe, expect, it } from "vitest";
import { filterProjectsByQuery, sortProjects } from "@/lib/dashboard/projectListUtils";
import type { ProjectRecord } from "@/types/analysis";

function makeProject(overrides: {
  id: string;
  title: string;
  description?: string;
  updatedAt: string;
  qualityScore: number;
}): ProjectRecord {
  return {
    meta: {
      id: overrides.id,
      title: overrides.title,
      description: overrides.description ?? "",
      dataType: "일반",
      analysisGoal: "현황 파악",
      createdAt: overrides.updatedAt,
      updatedAt: overrides.updatedAt,
    },
    file: {
      id: `file_${overrides.id}`,
      projectId: overrides.id,
      fileName: "sample.csv",
      fileType: "csv",
      rowCount: 100,
      columnCount: 3,
      createdAt: overrides.updatedAt,
    },
    analysis: {
      qualityScore: overrides.qualityScore,
      schemaSummary: { rowCount: 100, columnCount: 3, columns: [] },
      missingSummary: {
        totalCells: 300,
        totalMissingCells: 0,
        overallMissingRate: 0,
        duplicateRowCount: 0,
        columns: [],
      },
      numericSummary: [],
      categoricalSummary: [],
      chartSpecs: [],
      mapSpecs: { detected: false, mode: "none", points: [] },
      insightSummary: "",
      generatedAt: overrides.updatedAt,
    },
    reports: [],
  };
}

const projects = [
  makeProject({ id: "a", title: "창원 인구 분석", description: "생활인구 현황", updatedAt: "2026-06-01T00:00:00Z", qualityScore: 60 }),
  makeProject({ id: "b", title: "김해 카드매출 분석", description: "소상공인 매출 동향", updatedAt: "2026-07-01T00:00:00Z", qualityScore: 90 }),
  makeProject({ id: "c", title: "거제 관광 분석", description: "관광 유동인구", updatedAt: "2026-06-15T00:00:00Z", qualityScore: 75 }),
];

describe("sortProjects", () => {
  it("sorts by most recently updated first", () => {
    const sorted = sortProjects(projects, "recent");
    expect(sorted.map((p) => p.meta.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts by title using Korean locale order", () => {
    const sorted = sortProjects(projects, "name");
    expect(sorted.map((p) => p.meta.id)).toEqual(["c", "b", "a"]);
  });

  it("sorts by quality score descending", () => {
    const sorted = sortProjects(projects, "quality");
    expect(sorted.map((p) => p.meta.id)).toEqual(["b", "c", "a"]);
  });

  it("does not mutate the original array", () => {
    const original = [...projects];
    sortProjects(projects, "name");
    expect(projects).toEqual(original);
  });
});

describe("filterProjectsByQuery", () => {
  it("returns all projects when the query is empty or whitespace", () => {
    expect(filterProjectsByQuery(projects, "")).toEqual(projects);
    expect(filterProjectsByQuery(projects, "   ")).toEqual(projects);
  });

  it("matches by title case-insensitively", () => {
    const result = filterProjectsByQuery(projects, "김해");
    expect(result.map((p) => p.meta.id)).toEqual(["b"]);
  });

  it("matches by description text", () => {
    const result = filterProjectsByQuery(projects, "관광 유동");
    expect(result.map((p) => p.meta.id)).toEqual(["c"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterProjectsByQuery(projects, "존재하지않음")).toEqual([]);
  });
});
