// Supabase 설정 시 사용하는 원격 저장 백엔드. 4개 테이블(projects/uploaded_files/analysis_results/reports)에 매핑한다
import type { AnalysisResult, ProjectRecord, ReportRecord } from "@/types/analysis";
import { getSupabaseClient, DATASETS_BUCKET } from "@/lib/supabase/client";
import { generateShareToken } from "./shareToken";
import type { CreateProjectInput, ProjectComment, ProjectShare } from "./types";

function toAnalysisResult(row: Record<string, unknown>): AnalysisResult {
  return {
    qualityScore: row.quality_score as number,
    schemaSummary: row.schema_summary as AnalysisResult["schemaSummary"],
    missingSummary: row.missing_summary as AnalysisResult["missingSummary"],
    numericSummary: row.numeric_summary as AnalysisResult["numericSummary"],
    categoricalSummary: row.categorical_summary as AnalysisResult["categoricalSummary"],
    chartSpecs: row.chart_specs as AnalysisResult["chartSpecs"],
    mapSpecs: row.map_specs as AnalysisResult["mapSpecs"],
    insightSummary: row.insight_summary as string,
    generatedAt: row.created_at as string,
  };
}

export async function listProjectsRemote(): Promise<ProjectRecord[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*, uploaded_files(*), analysis_results(*), reports(*)")
    .order("created_at", { ascending: false });
  if (error || !projects) return [];

  return projects
    .filter((p) => p.analysis_results?.length > 0 && p.uploaded_files?.length > 0)
    .map((p) => mapRowToProjectRecord(p));
}

export async function getProjectRemote(id: string): Promise<ProjectRecord | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("projects")
    .select("*, uploaded_files(*), analysis_results(*), reports(*)")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return mapRowToProjectRecord(data);
}

function mapRowToProjectRecord(row: any): ProjectRecord {
  const file = row.uploaded_files[0];
  const analysisRow = row.analysis_results[row.analysis_results.length - 1];
  return {
    meta: {
      id: row.id,
      title: row.title,
      description: row.description ?? "",
      dataType: row.data_type,
      analysisGoal: row.analysis_goal ?? "",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    file: {
      id: file.id,
      projectId: row.id,
      fileName: file.file_name,
      fileType: file.file_type,
      rowCount: file.row_count,
      columnCount: file.column_count,
      createdAt: file.created_at,
    },
    analysis: toAnalysisResult(analysisRow),
    reports: (row.reports ?? []).map(
      (r: any): ReportRecord => ({
        id: r.id,
        projectId: row.id,
        title: r.title,
        content: r.content,
        createdAt: r.created_at,
      })
    ),
  };
}

export async function createProjectRemote(
  input: CreateProjectInput
): Promise<ProjectRecord> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다.");

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      title: input.title,
      description: input.description,
      data_type: input.dataType,
      analysis_goal: input.analysisGoal,
    })
    .select()
    .single();
  if (projectError || !project) throw projectError ?? new Error("프로젝트 생성 실패");

  if (input.file) {
    const { error: uploadError } = await supabase.storage
      .from(DATASETS_BUCKET)
      .upload(`${project.id}/raw/${input.fileName}`, input.file, { upsert: true });
    if (uploadError) throw uploadError;
  }

  const { data: fileRow, error: fileError } = await supabase
    .from("uploaded_files")
    .insert({
      project_id: project.id,
      file_name: input.fileName,
      file_path: `${project.id}/raw/${input.fileName}`,
      file_type: input.fileType,
      row_count: input.analysis.schemaSummary.rowCount,
      column_count: input.analysis.schemaSummary.columnCount,
    })
    .select()
    .single();
  if (fileError || !fileRow) throw fileError ?? new Error("파일 메타 저장 실패");

  const { data: analysisRow, error: analysisError } = await supabase
    .from("analysis_results")
    .insert({
      project_id: project.id,
      quality_score: input.analysis.qualityScore,
      schema_summary: input.analysis.schemaSummary,
      missing_summary: input.analysis.missingSummary,
      numeric_summary: input.analysis.numericSummary,
      categorical_summary: input.analysis.categoricalSummary,
      chart_specs: input.analysis.chartSpecs,
      map_specs: input.analysis.mapSpecs,
      insight_summary: input.analysis.insightSummary,
    })
    .select()
    .single();
  if (analysisError || !analysisRow) throw analysisError ?? new Error("분석결과 저장 실패");

  return {
    meta: {
      id: project.id,
      title: project.title,
      description: project.description ?? "",
      dataType: project.data_type,
      analysisGoal: project.analysis_goal ?? "",
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    },
    file: {
      id: fileRow.id,
      projectId: project.id,
      fileName: fileRow.file_name,
      fileType: fileRow.file_type,
      rowCount: fileRow.row_count,
      columnCount: fileRow.column_count,
      createdAt: fileRow.created_at,
    },
    analysis: toAnalysisResult(analysisRow),
    reports: [],
    // 전처리 리포트는 별도 테이블이 없어 원격 저장소에는 영속화되지 않음 — 생성 직후 응답에만 포함
    preprocessing: input.preprocessing,
  };
}

export async function addReportRemote(
  projectId: string,
  report: { title: string; content: string }
): Promise<ReportRecord> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다.");

  const { data, error } = await supabase
    .from("reports")
    .insert({ project_id: projectId, title: report.title, content: report.content })
    .select()
    .single();
  if (error || !data) throw error ?? new Error("보고서 저장 실패");

  return {
    id: data.id,
    projectId,
    title: data.title,
    content: data.content,
    createdAt: data.created_at,
  };
}

export async function createShareRemote(
  projectId: string,
  expiresAt: string | null = null
): Promise<ProjectShare> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다.");

  const { data, error } = await supabase
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

export async function getProjectByTokenRemote(token: string): Promise<ProjectRecord | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: share, error } = await supabase
    .from("project_shares")
    .select("*")
    .eq("token", token)
    .single();
  if (error || !share) return null;
  if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) return null;

  return getProjectRemote(share.project_id);
}

export async function listCommentsRemote(projectId: string): Promise<ProjectComment[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
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

export async function addCommentRemote(
  projectId: string,
  input: { authorName: string; content: string }
): Promise<ProjectComment> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다.");

  const { data, error } = await supabase
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
