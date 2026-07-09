// 공유 링크 생성/댓글 작성의 클라이언트 전용 진입점. Supabase 설정 시 API 라우트(service-role)를 거치고,
// 데모(로컬) 모드에서는 브라우저 저장소를 직접 사용한다. service-role 키는 이 파일에 절대 포함하지 않는다
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createShareLocal, addCommentLocal } from "./localStore";
import type { ProjectComment, ProjectShare } from "./types";

export async function createShare(
  projectId: string,
  expiresAt: string | null = null
): Promise<ProjectShare> {
  if (!isSupabaseConfigured) return createShareLocal(projectId, expiresAt);

  const res = await fetch("/api/shares", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, expiresAt }),
  });
  if (!res.ok) throw new Error("공유 링크 생성에 실패했습니다.");
  return res.json();
}

export async function addComment(
  projectId: string,
  input: { authorName: string; content: string }
): Promise<ProjectComment> {
  if (!isSupabaseConfigured) return addCommentLocal(projectId, input);

  const res = await fetch("/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, ...input }),
  });
  if (!res.ok) throw new Error("댓글 저장에 실패했습니다.");
  return res.json();
}
