// 공유 링크/댓글 로컬 스토어 함수 테스트. window.localStorage를 메모리 Map으로 스텁한다
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";
import { runAnalysis } from "@/lib/analytics";
import type { ParsedDataset } from "@/types/analysis";
import {
  createProjectLocal,
  createShareLocal,
  getProjectByTokenLocal,
  listCommentsLocal,
  addCommentLocal,
} from "./localStore";
import type { CreateProjectInput } from "./types";

function createMockWindow() {
  const store = new Map<string, string>();
  return {
    localStorage: {
      getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    },
  };
}

function buildCreateProjectInput(title: string): CreateProjectInput {
  const dataset: ParsedDataset = {
    columns: ["지역", "값"],
    rows: [
      { 지역: "창원", 값: 10 },
      { 지역: "김해", 값: 20 },
      { 지역: "진주", 값: 30 },
    ],
  };
  const analysis = runAnalysis(dataset);
  return {
    title,
    description: "테스트 프로젝트",
    dataType: "일반",
    analysisGoal: "테스트",
    fileName: "test.csv",
    fileType: "csv",
    file: null,
    analysis,
  };
}

describe("localStore 공유 링크", () => {
  beforeEach(() => {
    vi.stubGlobal("window", createMockWindow());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("공유 링크를 생성하고 토큰으로 프로젝트를 조회할 수 있다", async () => {
    const project = await createProjectLocal(buildCreateProjectInput("공유테스트1"));

    const share = await createShareLocal(project.meta.id);
    expect(share.token.length).toBeGreaterThan(0);
    expect(share.projectId).toBe(project.meta.id);
    expect(share.expiresAt).toBeNull();

    const found = await getProjectByTokenLocal(share.token);
    expect(found?.meta.id).toBe(project.meta.id);
  });

  it("만료된 공유 링크는 조회되지 않는다", async () => {
    const project = await createProjectLocal(buildCreateProjectInput("공유테스트2"));
    const pastDate = new Date(Date.now() - 60_000).toISOString();
    const share = await createShareLocal(project.meta.id, pastDate);

    const found = await getProjectByTokenLocal(share.token);
    expect(found).toBeNull();
  });

  it("존재하지 않는 토큰은 null을 반환한다", async () => {
    const found = await getProjectByTokenLocal("no-such-token");
    expect(found).toBeNull();
  });

  it("서로 다른 두 번의 공유 링크 생성은 서로 다른 토큰을 발급한다", async () => {
    const project = await createProjectLocal(buildCreateProjectInput("공유테스트3"));
    const shareA = await createShareLocal(project.meta.id);
    const shareB = await createShareLocal(project.meta.id);
    expect(shareA.token).not.toBe(shareB.token);
  });
});

describe("localStore 댓글", () => {
  beforeEach(() => {
    vi.stubGlobal("window", createMockWindow());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("댓글을 작성하고 프로젝트별로 조회할 수 있다", async () => {
    const project = await createProjectLocal(buildCreateProjectInput("댓글테스트1"));

    const comment = await addCommentLocal(project.meta.id, {
      authorName: "홍길동",
      content: "좋은 분석입니다",
    });
    expect(comment.projectId).toBe(project.meta.id);
    expect(comment.authorName).toBe("홍길동");

    const comments = await listCommentsLocal(project.meta.id);
    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe("좋은 분석입니다");
  });

  it("다른 프로젝트의 댓글은 섞이지 않는다", async () => {
    const projectA = await createProjectLocal(buildCreateProjectInput("댓글테스트2A"));
    const projectB = await createProjectLocal(buildCreateProjectInput("댓글테스트2B"));

    await addCommentLocal(projectA.meta.id, { authorName: "A", content: "A 댓글" });
    await addCommentLocal(projectB.meta.id, { authorName: "B", content: "B 댓글" });

    const commentsA = await listCommentsLocal(projectA.meta.id);
    const commentsB = await listCommentsLocal(projectB.meta.id);
    expect(commentsA).toHaveLength(1);
    expect(commentsA[0].authorName).toBe("A");
    expect(commentsB).toHaveLength(1);
    expect(commentsB[0].authorName).toBe("B");
  });

  it("프로젝트에 댓글이 없으면 빈 배열을 반환한다", async () => {
    const project = await createProjectLocal(buildCreateProjectInput("댓글테스트3"));
    const comments = await listCommentsLocal(project.meta.id);
    expect(comments).toEqual([]);
  });
});
