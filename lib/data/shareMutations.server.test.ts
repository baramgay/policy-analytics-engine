// 공유 링크 생성/댓글 작성 서버 전용 로직(createShareServer/addCommentServer) 테스트
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: true,
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: vi.fn(),
}));

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createShareServer, addCommentServer } from "./shareMutations.server";

function createAdminMock(responses: Record<string, { data: unknown; error: unknown }>) {
  return {
    from: vi.fn((table: string) => {
      const response = responses[table] ?? { data: null, error: null };
      const builder: Record<string, unknown> = {
        insert: vi.fn(() => builder),
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        single: vi.fn(() => Promise.resolve(response)),
        // eq()가 종착점인 호출(예: hasActiveShare)을 위해 builder 자체도 thenable로 만든다
        then: (resolve: (value: unknown) => unknown) => resolve(response),
      };
      return builder;
    }),
  };
}

describe("shareMutations.server 공유 링크 생성", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseAdminClient).mockReset();
  });

  it("공유 링크를 생성하면 토큰과 프로젝트 id를 담은 레코드를 반환한다", async () => {
    const shareRow = {
      id: "share-1",
      project_id: "proj-1",
      token: "abc123",
      created_at: "2026-01-01T00:00:00.000Z",
      expires_at: null,
    };
    const mock = createAdminMock({ project_shares: { data: shareRow, error: null } });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mock as any);

    const share = await createShareServer("proj-1");
    expect(share.token).toBe("abc123");
    expect(share.projectId).toBe("proj-1");
    expect(share.expiresAt).toBeNull();
  });
});

describe("shareMutations.server 댓글 작성", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseAdminClient).mockReset();
  });

  it("활성 공유 링크가 없는 프로젝트는 댓글 작성이 거부된다", async () => {
    const mock = createAdminMock({ project_shares: { data: [], error: null } });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mock as any);

    await expect(
      addCommentServer("proj-1", { authorName: "홍길동", content: "내용" })
    ).rejects.toThrow();
  });

  it("만료된 공유 링크만 있는 프로젝트는 댓글 작성이 거부된다", async () => {
    const mock = createAdminMock({
      project_shares: {
        data: [{ expires_at: new Date(Date.now() - 60_000).toISOString() }],
        error: null,
      },
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mock as any);

    await expect(
      addCommentServer("proj-1", { authorName: "홍길동", content: "내용" })
    ).rejects.toThrow();
  });

  it("활성 공유 링크가 있으면 댓글을 저장한다", async () => {
    const row = {
      id: "comment-1",
      author_name: "홍길동",
      content: "좋은 분석입니다",
      created_at: "2026-01-01T00:00:00.000Z",
    };
    const mock = createAdminMock({
      project_shares: { data: [{ expires_at: null }], error: null },
      project_comments: { data: row, error: null },
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mock as any);

    const comment = await addCommentServer("proj-1", { authorName: "홍길동", content: "좋은 분석입니다" });
    expect(comment.id).toBe("comment-1");
    expect(comment.projectId).toBe("proj-1");
    expect(comment.authorName).toBe("홍길동");
  });
});
