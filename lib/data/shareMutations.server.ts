// 공유 링크 생성/댓글 작성의 서버 전용 구현. API 라우트(app/api/shares, app/api/comments)에서만 호출한다
import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createShareLocal, addCommentLocal } from "./localStore";
import { generateShareToken } from "./shareToken";
import type { ProjectComment, ProjectShare } from "./types";

async function createShareRemoteAdmin(
  projectId: string,
  expiresAt: string | null
): Promise<ProjectShare> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase가 설정되지 않았습니다.");

  const { data, error } = await admin
    .from("project_shares")
    .insert({ project_id: projectId, token: generateShareToken(), expires_at: expiresAt })
    .select()
    .single();
  if (error || !data) throw error ?? new Error("공유 링크 생성 실패");

  return {
    id: data.id,
    projectId: data.project_id,
    token: data.token,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
  };
}

export async function createShareServer(
  projectId: string,
  expiresAt: string | null = null
): Promise<ProjectShare> {
  return isSupabaseConfigured
    ? createShareRemoteAdmin(projectId, expiresAt)
    : createShareLocal(projectId, expiresAt);
}

async function hasActiveShare(admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>, projectId: string) {
  const { data } = await admin.from("project_shares").select("expires_at").eq("project_id", projectId);
  if (!data) return false;
  return data.some((row: any) => !row.expires_at || new Date(row.expires_at).getTime() >= Date.now());
}

async function addCommentRemoteAdmin(
  projectId: string,
  input: { authorName: string; content: string }
): Promise<ProjectComment> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase가 설정되지 않았습니다.");

  // 공유된 적 없는 프로젝트에 임의 댓글이 쌓이지 않도록 활성 공유 링크 존재 여부를 먼저 확인한다
  if (!(await hasActiveShare(admin, projectId))) {
    throw new Error("공유되지 않은 프로젝트입니다.");
  }

  const { data, error } = await admin
    .from("project_comments")
    .insert({ project_id: projectId, author_name: input.authorName, content: input.content })
    .select()
    .single();
  if (error || !data) throw error ?? new Error("댓글 저장 실패");

  return {
    id: data.id,
    projectId,
    authorName: data.author_name,
    content: data.content,
    createdAt: data.created_at,
  };
}

export async function addCommentServer(
  projectId: string,
  input: { authorName: string; content: string }
): Promise<ProjectComment> {
  return isSupabaseConfigured ? addCommentRemoteAdmin(projectId, input) : addCommentLocal(projectId, input);
}
