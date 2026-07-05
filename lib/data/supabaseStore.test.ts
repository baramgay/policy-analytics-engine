// 공유 링크/댓글 원격(Supabase) 스토어 함수 테스트. supabase 클라이언트를 체이너블 모의 객체로 대체한다
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: vi.fn(),
  DATASETS_BUCKET: "datasets",
}));

import { getSupabaseClient } from "@/lib/supabase/client";
import {
  createShareRemote,
  getProjectByTokenRemote,
  listCommentsRemote,
  addCommentRemote,
} from "./supabaseStore";

type TableResponse = { data: unknown; error: unknown };

function createSupabaseMock(responses: Record<string, TableResponse>) {
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

describe("supabaseStore 공유 링크", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseClient).mockReset();
  });

  it("Supabase 미설정 시 공유 링크 생성은 예외를 던진다", async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(null);
    await expect(createShareRemote("proj-1")).rejects.toThrow();
  });

  it("공유 링크를 생성하면 토큰과 프로젝트 id를 담은 레코드를 반환한다", async () => {
    const shareRow = {
      id: "share-1",
      project_id: "proj-1",
      token: "abc123",
      created_at: "2026-01-01T00:00:00.000Z",
      expires_at: null,
    };
    const mock = createSupabaseMock({ project_shares: { data: shareRow, error: null } });
    vi.mocked(getSupabaseClient).mockReturnValue(mock as any);

    const share = await createShareRemote("proj-1");
    expect(share.token).toBe("abc123");
    expect(share.projectId).toBe("proj-1");
    expect(share.expiresAt).toBeNull();
  });

  it("Supabase 미설정 시 토큰 조회는 null을 반환한다", async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(null);
    const found = await getProjectByTokenRemote("abc123");
    expect(found).toBeNull();
  });

  it("존재하지 않는 토큰은 null을 반환한다", async () => {
    const mock = createSupabaseMock({
      project_shares: { data: null, error: { message: "not found" } },
    });
    vi.mocked(getSupabaseClient).mockReturnValue(mock as any);

    const found = await getProjectByTokenRemote("no-such-token");
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
    const mock = createSupabaseMock({ project_shares: { data: shareRow, error: null } });
    vi.mocked(getSupabaseClient).mockReturnValue(mock as any);

    const found = await getProjectByTokenRemote("abc123");
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
    const mock = createSupabaseMock({
      project_shares: { data: shareRow, error: null },
      projects: { data: projectRow, error: null },
    });
    vi.mocked(getSupabaseClient).mockReturnValue(mock as any);

    const found = await getProjectByTokenRemote("abc123");
    expect(found?.meta.id).toBe("proj-1");
    expect(found?.meta.title).toBe("제목");
  });
});

describe("supabaseStore 댓글", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseClient).mockReset();
  });

  it("Supabase 미설정 시 댓글 목록은 빈 배열을 반환한다", async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(null);
    const comments = await listCommentsRemote("proj-1");
    expect(comments).toEqual([]);
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
    const mock = createSupabaseMock({ project_comments: { data: rows, error: null } });
    vi.mocked(getSupabaseClient).mockReturnValue(mock as any);

    const comments = await listCommentsRemote("proj-1");
    expect(comments).toHaveLength(1);
    expect(comments[0].authorName).toBe("홍길동");
    expect(comments[0].content).toBe("좋은 분석입니다");
  });

  it("Supabase 미설정 시 댓글 작성은 예외를 던진다", async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(null);
    await expect(addCommentRemote("proj-1", { authorName: "홍길동", content: "내용" })).rejects.toThrow();
  });

  it("댓글을 작성하면 저장된 레코드를 반환한다", async () => {
    const row = {
      id: "comment-1",
      author_name: "홍길동",
      content: "좋은 분석입니다",
      created_at: "2026-01-01T00:00:00.000Z",
    };
    const mock = createSupabaseMock({ project_comments: { data: row, error: null } });
    vi.mocked(getSupabaseClient).mockReturnValue(mock as any);

    const comment = await addCommentRemote("proj-1", { authorName: "홍길동", content: "좋은 분석입니다" });
    expect(comment.id).toBe("comment-1");
    expect(comment.projectId).toBe("proj-1");
    expect(comment.authorName).toBe("홍길동");
  });
});
