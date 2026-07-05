"use client";

// 대시보드 프로젝트 목록: 검색·정렬 상태를 갖는 클라이언트 컴포넌트. 정렬/검색 계산은 lib/dashboard에 위임한다
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FolderKanban } from "lucide-react";
import {
  Card,
  Heading,
  List,
  ListItem,
  Badge,
  EmptyState,
  TextInput,
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core";
import type { ProjectRecord } from "@/types/analysis";
import { filterProjectsByQuery, sortProjects, type ProjectSortKey } from "@/lib/dashboard/projectListUtils";
import { LinkButton } from "@/components/nav/LinkButton";

function qualityBadge(score: number) {
  if (score >= 80) return <Badge variant="success" label={`품질 ${score}점`} />;
  if (score >= 50) return <Badge variant="warning" label={`품질 ${score}점`} />;
  return <Badge variant="error" label={`품질 ${score}점`} />;
}

export function ProjectListPanel({ projects }: { projects: ProjectRecord[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<ProjectSortKey>("recent");

  const filtered = useMemo(() => filterProjectsByQuery(projects, query), [projects, query]);
  const sorted = useMemo(() => sortProjects(filtered, sortKey), [filtered, sortKey]);

  return (
    <Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Heading level={2}>프로젝트 목록</Heading>
          {projects.length > 0 ? (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <TextInput
                label="프로젝트 검색"
                isLabelHidden
                placeholder="프로젝트 이름·설명으로 검색"
                value={query}
                onChange={setQuery}
                hasClear
                startIcon={<Search size={16} />}
                width={240}
                aria-label="프로젝트 검색"
              />
              <SegmentedControl value={sortKey} onChange={(value) => setSortKey(value as ProjectSortKey)} label="정렬 기준">
                <SegmentedControlItem value="recent" label="최근 수정순" />
                <SegmentedControlItem value="name" label="이름순" />
                <SegmentedControlItem value="quality" label="품질순" />
              </SegmentedControl>
            </div>
          ) : null}
        </div>

        {projects.length === 0 ? (
          <EmptyState
            title="아직 등록된 프로젝트가 없습니다"
            description="데이터 파일을 업로드하면 분석 엔진이 자동으로 품질 검사와 통계를 계산합니다"
            icon={<FolderKanban size={32} />}
            actions={<LinkButton href="/upload" label="데이터 업로드하기" variant="primary" />}
          />
        ) : sorted.length === 0 ? (
          <EmptyState
            title="검색 결과가 없습니다"
            description={`"${query.trim()}"와 일치하는 프로젝트를 찾지 못했습니다. 다른 검색어를 시도해 보세요.`}
            icon={<Search size={32} />}
          />
        ) : (
          <List hasDividers density="balanced">
            {sorted.map((project) => (
              <ListItem
                key={project.meta.id}
                href={`/projects/${project.meta.id}`}
                label={project.meta.title}
                description={`${project.meta.dataType} · ${project.meta.analysisGoal}`}
                endContent={
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <Badge
                      variant="neutral"
                      label={`${project.analysis.schemaSummary.rowCount.toLocaleString()}건`}
                    />
                    {project.preprocessing ? <Badge variant="info" label="전처리 완료" /> : null}
                    {qualityBadge(project.analysis.qualityScore)}
                  </div>
                }
              />
            ))}
          </List>
        )}
      </div>
    </Card>
  );
}
