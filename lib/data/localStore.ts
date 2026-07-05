// Supabase 미설정 시 사용하는 로컬(브라우저) 저장 백엔드. 데모 프로젝트를 최초 1회 시드한다
import type { ProjectRecord, ReportRecord } from "@/types/analysis";
import { demoProjects } from "@/data/demo/demoProjects";
import { generateShareToken } from "./shareToken";
import type { CreateProjectInput, ProjectComment, ProjectShare } from "./types";

const STORAGE_KEY = "policy-analytics:projects";
const SHARES_STORAGE_KEY = "policy-analytics:shares";
const COMMENTS_STORAGE_KEY = "policy-analytics:comments";

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
    preprocessing: input.preprocessing,
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

function readShares(): ProjectShare[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(SHARES_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ProjectShare[];
  } catch {
    return [];
  }
}

function writeShares(shares: ProjectShare[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SHARES_STORAGE_KEY, JSON.stringify(shares));
}

function readComments(): ProjectComment[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(COMMENTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ProjectComment[];
  } catch {
    return [];
  }
}

function writeComments(comments: ProjectComment[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
}

export async function createShareLocal(
  projectId: string,
  expiresAt: string | null = null
): Promise<ProjectShare> {
  const shares = readShares();
  const record: ProjectShare = {
    id: `share_${Math.random().toString(36).slice(2, 10)}`,
    projectId,
    token: generateShareToken(),
    createdAt: new Date().toISOString(),
    expiresAt,
  };
  shares.unshift(record);
  writeShares(shares);
  return record;
}

export async function getProjectByTokenLocal(token: string): Promise<ProjectRecord | null> {
  const share = readShares().find((s) => s.token === token);
  if (!share) return null;
  if (share.expiresAt && new Date(share.expiresAt).getTime() < Date.now()) return null;
  return getProjectLocal(share.projectId);
}

export async function listCommentsLocal(projectId: string): Promise<ProjectComment[]> {
  return readComments()
    .filter((c) => c.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addCommentLocal(
  projectId: string,
  input: { authorName: string; content: string }
): Promise<ProjectComment> {
  const comments = readComments();
  const record: ProjectComment = {
    id: `comment_${Math.random().toString(36).slice(2, 10)}`,
    projectId,
    authorName: input.authorName,
    content: input.content,
    createdAt: new Date().toISOString(),
  };
  comments.unshift(record);
  writeComments(comments);
  return record;
}
