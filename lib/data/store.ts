// 저장 레이어 단일 진입점. Supabase 환경변수 유무에 따라 원격/로컬 백엔드를 자동 선택한다
import type { ProjectRecord, ReportRecord } from "@/types/analysis";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { listProjectsLocal, getProjectLocal, createProjectLocal, addReportLocal } from "./localStore";
import { listProjectsRemote, getProjectRemote, createProjectRemote, addReportRemote } from "./supabaseStore";
import type { CreateProjectInput } from "./types";

export const isDemoMode = !isSupabaseConfigured;

export async function listProjects(): Promise<ProjectRecord[]> {
  return isSupabaseConfigured ? listProjectsRemote() : listProjectsLocal();
}

export async function getProject(id: string): Promise<ProjectRecord | null> {
  return isSupabaseConfigured ? getProjectRemote(id) : getProjectLocal(id);
}

export async function createProject(input: CreateProjectInput): Promise<ProjectRecord> {
  return isSupabaseConfigured ? createProjectRemote(input) : createProjectLocal(input);
}

export async function addReport(
  projectId: string,
  report: { title: string; content: string }
): Promise<ReportRecord> {
  return isSupabaseConfigured
    ? addReportRemote(projectId, report)
    : addReportLocal(projectId, report);
}

export type { CreateProjectInput };
