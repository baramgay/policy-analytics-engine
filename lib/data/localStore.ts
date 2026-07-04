// Supabase 미설정 시 사용하는 로컬(브라우저) 저장 백엔드. 데모 프로젝트를 최초 1회 시드한다
import type { ProjectRecord, ReportRecord } from "@/types/analysis";
import { demoProjects } from "@/data/demo/demoProjects";
import type { CreateProjectInput } from "./types";

const STORAGE_KEY = "policy-analytics:projects";

function readAll(): ProjectRecord[] {
  if (typeof window === "undefined") return demoProjects;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demoProjects));
    return demoProjects;
  }
  try {
    return JSON.parse(raw) as ProjectRecord[];
  } catch {
    return demoProjects;
  }
}

function writeAll(projects: ProjectRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export async function listProjectsLocal(): Promise<ProjectRecord[]> {
  return readAll();
}

export async function getProjectLocal(id: string): Promise<ProjectRecord | null> {
  return readAll().find((p) => p.meta.id === id) ?? null;
}

export async function createProjectLocal(
  input: CreateProjectInput
): Promise<ProjectRecord> {
  const now = new Date().toISOString();
  const id = `proj_${Math.random().toString(36).slice(2, 10)}`;

  const record: ProjectRecord = {
    meta: {
      id,
      title: input.title,
      description: input.description,
      dataType: input.dataType,
      analysisGoal: input.analysisGoal,
      createdAt: now,
      updatedAt: now,
    },
    file: {
      id: `file_${id}`,
      projectId: id,
      fileName: input.fileName,
      fileType: input.fileType,
      rowCount: input.analysis.schemaSummary.rowCount,
      columnCount: input.analysis.schemaSummary.columnCount,
      createdAt: now,
    },
    analysis: input.analysis,
    reports: [],
  };

  const projects = readAll();
  projects.unshift(record);
  writeAll(projects);
  return record;
}

export async function addReportLocal(
  projectId: string,
  report: Omit<ReportRecord, "id" | "projectId" | "createdAt">
): Promise<ReportRecord> {
  const projects = readAll();
  const project = projects.find((p) => p.meta.id === projectId);
  if (!project) throw new Error("프로젝트를 찾을 수 없습니다.");

  const record: ReportRecord = {
    id: `report_${Math.random().toString(36).slice(2, 10)}`,
    projectId,
    title: report.title,
    content: report.content,
    createdAt: new Date().toISOString(),
  };
  project.reports.unshift(record);
  writeAll(projects);
  return record;
}
