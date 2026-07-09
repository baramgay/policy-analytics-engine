// 프로젝트 CRUD 원격(Supabase) 스토어 함수 테스트. 공유 링크/댓글 테스트는 shareServer.test.ts, shareMutations.server.test.ts로 이동했다
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: vi.fn(),
  DATASETS_BUCKET: "datasets",
}));

import { getSupabaseClient } from "@/lib/supabase/client";
import { getProjectRemote, listProjectsRemote } from "./supabaseStore";

function createSupabaseMock(responses: Record<string, { data: unknown; error: unknown }>) {
  return {
    from: vi.fn((table: string) => {
      const response = responses[table] ?? { data: null, error: null };
      const builder: Record<string, unknown> = {
        insert: vi.fn(() => builder),
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        single: vi.fn(() => Promise.resolve(response)),
        order: vi.fn(() => Promise.resolve(response)),
      };
      return builder;
    }),
  };
}

const projectRow = {
  id: "proj-1",
  title: "제목",
  description: "설명",
  data_type: "일반",
  analysis_goal: "목적",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  uploaded_files: [
    {
      id: "file-1",
      file_name: "a.csv",
      file_type: "csv",
      row_count: 10,
      column_count: 3,
      created_at: "2026-01-01T00:00:00.000Z",
    },
  ],
  analysis_results: [
    {
      quality_score: 90,
      schema_summary: { rowCount: 10, columnCount: 3, columns: [] },
      missing_summary: { totalCells: 30, totalMissingCells: 0, overallMissingRate: 0, duplicateRowCount: 0, columns: [] },
      numeric_summary: [],
      categorical_summary: [],
      chart_specs: [],
      map_specs: { detected: false, mode: "none", points: [] },
      insight_summary: "인사이트",
      created_at: "2026-01-01T00:00:00.000Z",
    },
  ],
  reports: [],
};

describe("supabaseStore 프로젝트 조회", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseClient).mockReset();
  });

  it("Supabase 미설정 시 목록은 빈 배열을 반환한다", async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(null);
    const projects = await listProjectsRemote();
    expect(projects).toEqual([]);
  });

  it("Supabase 미설정 시 단건 조회는 null을 반환한다", async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(null);
    const found = await getProjectRemote("proj-1");
    expect(found).toBeNull();
  });

  it("단건 조회 시 프로젝트 레코드를 매핑해 반환한다", async () => {
    const mock = createSupabaseMock({ projects: { data: projectRow, error: null } });
    vi.mocked(getSupabaseClient).mockReturnValue(mock as any);

    const found = await getProjectRemote("proj-1");
    expect(found?.meta.id).toBe("proj-1");
    expect(found?.meta.title).toBe("제목");
  });
});
