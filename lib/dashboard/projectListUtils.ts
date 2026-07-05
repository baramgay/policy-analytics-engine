// 대시보드 프로젝트 목록의 정렬·검색 로직. 계산된 값을 재정렬/재필터링만 하고 새로운 분석은 하지 않는다
import type { ProjectRecord } from "@/types/analysis";

export type ProjectSortKey = "recent" | "name" | "quality";

/**
 * 프로젝트 목록을 정렬 기준에 따라 새 배열로 반환한다 (원본 배열은 변경하지 않는다).
 * - recent: 최근 수정순 (updatedAt 내림차순)
 * - name: 이름순 (한글 로케일 기준 오름차순)
 * - quality: 품질 점수 높은순 (내림차순)
 */
export function sortProjects(projects: ProjectRecord[], sortKey: ProjectSortKey): ProjectRecord[] {
  const copy = [...projects];
  switch (sortKey) {
    case "name":
      return copy.sort((a, b) => a.meta.title.localeCompare(b.meta.title, "ko"));
    case "quality":
      return copy.sort((a, b) => b.analysis.qualityScore - a.analysis.qualityScore);
    case "recent":
    default:
      return copy.sort(
        (a, b) => new Date(b.meta.updatedAt).getTime() - new Date(a.meta.updatedAt).getTime()
      );
  }
}

/**
 * 프로젝트 제목/설명에 검색어가 포함된 항목만 남긴다. 대소문자 구분 없이 비교하며,
 * 검색어가 비어 있으면(공백만 있어도) 전체 목록을 그대로 반환한다.
 */
export function filterProjectsByQuery(projects: ProjectRecord[], query: string): ProjectRecord[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return projects;
  return projects.filter((project) => {
    const haystack = `${project.meta.title} ${project.meta.description}`.toLowerCase();
    return haystack.includes(trimmed);
  });
}
