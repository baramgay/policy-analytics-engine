// 공유 화면 서버 전용 조회(getProjectByToken/listComments) 테스트. service-role 클라이언트를 모의 객체로 대체한다
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: true,
  getSupabaseClient: vi.fn(),
  DATASETS_BUCKET: "datasets",
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: vi.fn(),
}));

import { getSupabaseClient } from "@/lib/supabase/client";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getProjectByToken, listComments } from "./shareServer";

function createAdminMock(responses: Record<string, { data: unknown; error: unknown }>) {
  return {
    from: vi.fn((table: string) => {
      const response = responses[table] ?? { data: null, error: null };
      const builder: Record<string, unknown> = {
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

describe("shareServer 공유 링크 조회", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseAdminClient).mockReset();
    vi.mocked(getSupabaseClient).mockReset();
  });

  it("존재하지 않는 토큰은 null을 반환한다", async () => {
    const mock = createAdminMock({ project_shares: { data: null, error: { message: "not found" } } });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mock as any);

    const found = await getProjectByToken("no-such-token");
    expect(found).toBeNull();
  });

  it("만료된 공유 링크는 조회되지 않는다", async () => {
    const shareRow = {
      id: "share-1",
      project_id: "proj-1",
      token: "abc123",
      created_at: "2026-01-01T00:00:00.000Z",
      expires_at: new Date(Date.now() - 60_000).toISOString(),
    };
    const mock = createAdminMock({ project_shares: { data: shareRow, error: null } });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mock as any);

    const found = await getProjectByToken("abc123");
    expect(found).toBeNull();
  });

  it("유효한 토큰이면 프로젝트 정보를 반환한다", async () => {
    const shareRow = {
      id: "share-1",
      project_id: "proj-1",
      token: "abc123",
      created_at: "2026-01-01T00:00:00.000Z",
      expires_at: null,
    };
    const mock = createAdminMock({
      project_shares: { data: shareRow, error: null },
      projects: { data: projectRow, error: null },
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mock as any);
    vi.mocked(getSupabaseClient).mockReturnValue(mock as any);

    const found = await getProjectByToken("abc123");
    expect(found?.meta.id).toBe("proj-1");
    expect(found?.meta.title).toBe("제목");
  });
});

describe("shareServer 댓글 조회", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseAdminClient).mockReset();
  });

  it("댓글 목록을 조회하면 매핑된 레코드를 반환한다", async () => {
    const rows = [
      {
        id: "comment-1",
        project_id: "proj-1",
        author_name: "홍길동",
        content: "좋은 분석입니다",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ];
    const mock = createAdminMock({ project_comments: { data: rows, error: null } });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mock as any);

    const comments = await listComments("proj-1");
    expect(comments).toHaveLength(1);
    expect(comments[0].authorName).toBe("홍길동");
    expect(comments[0].content).toBe("좋은 분석입니다");
  });
});
