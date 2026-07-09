// 공유 링크/댓글 서버 전용 조회 로직. service-role 클라이언트를 사용하므로 서버 컴포넌트·API 라우트에서만 import한다
import "server-only";
import type { ProjectRecord } from "@/types/analysis";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getProjectRemote } from "./supabaseStore";
import {
  getProjectByTokenLocal,
  listCommentsLocal,
} from "./localStore";
import type { ProjectComment } from "./types";

async function getProjectByTokenRemoteAdmin(token: string): Promise<ProjectRecord | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const { data: share, error } = await admin
    .from("project_shares")
    .select("*")
    .eq("token", token)
    .single();
  if (error || !share) return null;
  if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) return null;

  return getProjectRemote(share.project_id);
}

export async function getProjectByToken(token: string): Promise<ProjectRecord | null> {
  return isSupabaseConfigured ? getProjectByTokenRemoteAdmin(token) : getProjectByTokenLocal(token);
}

async function listCommentsRemoteAdmin(projectId: string): Promise<ProjectComment[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("project_comments")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  return data.map(
    (row: any): ProjectComment => ({
      id: row.id,
      projectId: row.project_id,
      authorName: row.author_name,
      content: row.content,
      createdAt: row.created_at,
    })
  );
}

export async function listComments(projectId: string): Promise<ProjectComment[]> {
  return isSupabaseConfigured ? listCommentsRemoteAdmin(projectId) : listCommentsLocal(projectId);
}
